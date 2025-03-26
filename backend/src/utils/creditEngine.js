const Transaction = require('../models/Transaction');
const FinancingRecord = require('../models/FinancingRecord');
const CreditLimitHistory = require('../models/CreditLimitHistory');
const User = require('../models/User');

/**
 * Credit Limit Engine
 * Weights: repayment timeliness 40%, order consistency 30%, volume growth 20%, tenure 10%
 * Recalculates every 24 hours via cron, and also triggered after repayment events
 * Requirement: "Analyses 12–24 months of partner transaction history"
 */

const BASE_CREDIT_LIMIT = 50000;
const MAX_CREDIT_LIMIT  = 500000;
const MIN_CREDIT_LIMIT  = 10000;

/**
 * Calculate weighted credit score for a user (0–100)
 */
const calculateCreditScore = async (userId, createdAt) => {
  const now = new Date();
  const twentyFourMonthsAgo = new Date(now);
  twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

  // ── Factor 1: Repayment timeliness (40%) ──────────────────────
  const allFinancing = await FinancingRecord.find({
    userId,
    status: { $in: ['completed', 'defaulted'] },
    createdAt: { $gte: twentyFourMonthsAgo },
  });

  let timelinessScore = 50; // neutral default
  if (allFinancing.length > 0) {
    const onTime = allFinancing.filter(f => f.status === 'completed').length;
    timelinessScore = Math.round((onTime / allFinancing.length) * 100);
  }

  // ── Factor 2: Order consistency (30%) ─────────────────────────
  // Count months with at least one transaction in last 24 months
  const txnByMonth = await Transaction.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
        status: 'successful',
        createdAt: { $gte: twentyFourMonthsAgo },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
      },
    },
  ]);
  const activeMonths   = txnByMonth.length;
  const totalMonths    = Math.max(1, Math.round((now - new Date(createdAt)) / (1000 * 60 * 60 * 24 * 30)));
  const consistencyScore = Math.min(100, Math.round((activeMonths / Math.min(totalMonths, 24)) * 100));

  // ── Factor 3: Volume growth (20%) ────────────────────────────
  // Compare last 3 months volume vs prior 3 months
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [recentVol, priorVol] = await Promise.all([
    Transaction.aggregate([
      { $match: { receiverId: userId, status: 'successful', type: { $in: ['deposit', 'financing_settlement'] }, createdAt: { $gte: threeMonthsAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { receiverId: userId, status: 'successful', type: { $in: ['deposit', 'financing_settlement'] }, createdAt: { $gte: sixMonthsAgo, $lt: threeMonthsAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const rv = recentVol[0]?.total || 0;
  const pv = priorVol[0]?.total || 1;
  const growthRatio = rv / pv;
  let growthScore = 50;
  if (growthRatio >= 1.2) growthScore = 100;
  else if (growthRatio >= 1.0) growthScore = 75;
  else if (growthRatio >= 0.8) growthScore = 50;
  else growthScore = 25;

  // ── Factor 4: Tenure (10%) ────────────────────────────────────
  const accountAgeDays  = (now - new Date(createdAt)) / (1000 * 60 * 60 * 24);
  const tenureScore = Math.min(100, Math.round((accountAgeDays / 365) * 100)); // 100% at 1 year

  // ── Weighted composite ────────────────────────────────────────
  const compositeScore =
    (timelinessScore  * 0.40) +
    (consistencyScore * 0.30) +
    (growthScore      * 0.20) +
    (tenureScore      * 0.10);

  return Math.round(compositeScore);
};

/**
 * Recalculate and update a user's credit limit based on their score
 */
const recalculateCreditLimit = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const score = await calculateCreditScore(userId, user.createdAt);

    // Map score to credit limit
    let newLimit;
    if (score >= 90)      newLimit = 500000;
    else if (score >= 80) newLimit = 300000;
    else if (score >= 70) newLimit = 200000;
    else if (score >= 60) newLimit = 100000;
    else if (score >= 50) newLimit = 75000;
    else if (score >= 40) newLimit = 50000;
    else if (score >= 30) newLimit = 30000;
    else                  newLimit = MIN_CREDIT_LIMIT;

    // If prohibited risk tier, no credit
    if (user.riskTier === 'prohibited') newLimit = 0;

    const oldLimit = user.totalCreditLimit;
    if (oldLimit === newLimit) return; // no change

    // Update credit (preserve how much is currently used)
    const usedCredit = Math.max(0, oldLimit - user.availableCredit);
    const newAvailable = Math.max(0, newLimit - usedCredit);

    await User.findByIdAndUpdate(userId, {
      totalCreditLimit: newLimit,
      availableCredit: newAvailable,
    });

    // Record the change
    await CreditLimitHistory.create({
      userId,
      previousLimit: oldLimit,
      newLimit,
      changeReason: 'repayment',
      triggeredBy: `credit_engine_score_${score}`,
    });

    console.log(`[CreditEngine] User ${userId} score=${score} limit: ${oldLimit} → ${newLimit}`);
    return { score, oldLimit, newLimit };
  } catch (err) {
    console.error('[CreditEngine] Error:', err.message);
  }
};

module.exports = { calculateCreditScore, recalculateCreditLimit };
