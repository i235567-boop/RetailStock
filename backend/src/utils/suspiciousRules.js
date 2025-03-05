const Transaction = require('../models/Transaction');

/**
 * Rule-based suspicious transaction monitoring
 * All rules run on BACKEND before final response
 * Minimum 5 rules as required
 */

const RULES = {
  // Rule 1: High-value transfer threshold
  HIGH_VALUE_TRANSFER: async (transaction, user) => {
    if (transaction.type === 'transfer' && transaction.amount > 100000) {
      return 'Transfer above PKR 100,000 threshold';
    }
    return null;
  },

  // Rule 2: Rapid transfer frequency (more than 5 transfers in 10 minutes)
  RAPID_TRANSFERS: async (transaction, user) => {
    if (transaction.type !== 'transfer') return null;
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentTransfers = await Transaction.countDocuments({
      senderId: user._id,
      type: 'transfer',
      createdAt: { $gte: tenMinutesAgo },
      status: { $in: ['successful', 'pending'] }
    });
    if (recentTransfers >= 5) {
      return 'More than 5 transfers within 10 minutes';
    }
    return null;
  },

  // Rule 3: Multiple failed withdrawals in one day (3+)
  MULTIPLE_FAILED_WITHDRAWALS: async (transaction, user) => {
    if (transaction.type !== 'withdrawal') return null;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const failedToday = await Transaction.countDocuments({
      senderId: user._id,
      type: 'withdrawal',
      status: 'failed',
      createdAt: { $gte: todayStart }
    });
    if (failedToday >= 3) {
      return 'More than 3 failed withdrawal attempts today';
    }
    return null;
  },

  // Rule 4: Repeated same amount transfers
  REPEATED_SAME_AMOUNT: async (transaction, user) => {
    if (transaction.type !== 'transfer') return null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const sameAmountCount = await Transaction.countDocuments({
      senderId: user._id,
      type: 'transfer',
      amount: transaction.amount,
      createdAt: { $gte: oneHourAgo },
      status: { $in: ['successful', 'pending'] }
    });
    if (sameAmountCount >= 3) {
      return `Same amount (PKR ${transaction.amount}) transferred 3+ times within an hour`;
    }
    return null;
  },

  // Rule 5: High-value transaction by new user (account < 7 days old)
  NEW_USER_HIGH_VALUE: async (transaction, user) => {
    const accountAgeDays = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < 7 && transaction.amount > 50000) {
      return 'High-value transaction by recently registered user (account < 7 days)';
    }
    return null;
  },

  // Rule 6: Large deposit (above 500,000 PKR)
  LARGE_DEPOSIT: async (transaction, user) => {
    if (transaction.type === 'deposit' && transaction.amount > 500000) {
      return 'Unusually large deposit above PKR 500,000';
    }
    return null;
  },

  // Rule 7: Financing velocity limit (more than 3 financing requests in a week)
  FINANCING_VELOCITY: async (transaction, user) => {
    if (transaction.type !== 'financing_settlement') return null;
    const FinancingRecord = require('../models/FinancingRecord');
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyFinancing = await FinancingRecord.countDocuments({
      userId: user._id,
      createdAt: { $gte: oneWeekAgo },
      status: { $in: ['active', 'completed'] }
    });
    if (weeklyFinancing > 3) {
      return 'Financing velocity limit exceeded: more than 3 financing requests in a week';
    }
    return null;
  },
};

/**
 * Run all suspicious transaction rules
 * Returns array of triggered reasons
 */
const checkSuspiciousRules = async (transaction, user) => {
  const reasons = [];
  for (const [ruleName, ruleFunc] of Object.entries(RULES)) {
    try {
      const result = await ruleFunc(transaction, user);
      if (result) reasons.push(result);
    } catch (err) {
      console.error(`Suspicious rule ${ruleName} error:`, err.message);
    }
  }
  return reasons;
};

module.exports = { checkSuspiciousRules };
