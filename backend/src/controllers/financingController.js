const FinancingRecord = require('../models/FinancingRecord');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const CreditLimitHistory = require('../models/CreditLimitHistory');
const { recalculateCreditLimit } = require('../utils/creditEngine');
const { sendSuccess, sendError, generateTransactionId, generateFinancingUuid, isValidObjectId } = require('../utils/helpers');
const { calculateMurabaha } = require('../utils/murabahaCalculator');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

// GET /api/financing/quote - fast response
exports.getQuote = async (req, res, next) => {
  try {
    const { amount, durationDays } = req.query;

    if (!amount || Number(amount) <= 0) return sendError(res, 'Amount must be greater than zero.', 400);
    if (![7, 14, 21, 30].includes(Number(durationDays))) return sendError(res, 'Duration must be 7, 14, 21, or 30 days.', 400);

    const user = await User.findById(req.user._id);
    if (Number(amount) > user.availableCredit) {
      return sendError(res, `Requested amount exceeds available credit of PKR ${user.availableCredit.toLocaleString()}.`, 400);
    }

    // All Murabaha calculation done on BACKEND
    const terms = calculateMurabaha(Number(amount), Number(durationDays));

    return sendSuccess(res, {
      availableCredit: user.availableCredit,
      terms,
      isEligible: true,
    }, 'Financing quote generated.');
  } catch (err) { next(err); }
};

// POST /api/financing/apply
exports.applyFinancing = async (req, res, next) => {
  try {
    const { amount, durationDays, purpose, productCategory, orderReference, pin } = req.body;

    if (!amount || Number(amount) <= 0) return sendError(res, 'Amount must be greater than zero.', 400);
    if (![7, 14, 21, 30].includes(Number(durationDays))) return sendError(res, 'Invalid duration.', 400);

    const user = await User.findById(req.user._id);

    // Backend validates against database credit limit
    if (Number(amount) > user.availableCredit) {
      return sendError(res, `Amount exceeds available credit of PKR ${user.availableCredit.toLocaleString()}.`, 400);
    }

    if (user.status === 'blocked') return sendError(res, 'Blocked accounts cannot apply for financing.', 403);

    // Check velocity limit: max 3 financing per week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyCount = await FinancingRecord.countDocuments({
      userId: user._id,
      createdAt: { $gte: oneWeekAgo },
      status: { $in: ['active', 'pending'] }
    });
    if (weeklyCount >= 3) return sendError(res, 'Financing velocity limit reached. Maximum 3 active financing per week.', 400);

    // Calculate Murabaha on BACKEND only
    const terms = calculateMurabaha(Number(amount), Number(durationDays));
    const financingUuid = generateFinancingUuid();

    // Create financing record before confirmation
    const financing = await FinancingRecord.create({
      financingUuid,
      userId: user._id,
      orderReference: orderReference || `ORD-${Date.now()}`,
      status: 'active',
      purpose: purpose || 'inventory',
      productCategory: productCategory || 'General',
      costPrice: terms.costPrice,
      profitMarkup: terms.profitMarkup,
      totalRepaymentAmount: terms.totalRepaymentAmount,
      financingDate: new Date(),
      dueDate: terms.dueDate,
      durationDays: terms.durationDays,
      remainingBalance: terms.totalRepaymentAmount,
      repaidAmount: 0,
      markupRate: terms.markupRate,
      digitalSignature: `SIG-${financingUuid}-${Date.now()}`,
    });

    // Atomically decrease available credit
    await User.findByIdAndUpdate(user._id, {
      $inc: { availableCredit: -Number(amount) }
    });

    // Record credit limit change
    await CreditLimitHistory.create({
      userId: user._id,
      previousLimit: user.availableCredit,
      newLimit: user.availableCredit - Number(amount),
      changeReason: 'manual',
      triggeredBy: 'financing_approval',
    });

    // Create financing settlement transaction
    const txnId = generateTransactionId();
    await Transaction.create({
      transactionId: txnId,
      receiverId: user._id,
      amount: Number(amount),
      type: 'financing_settlement',
      status: 'successful',
      category: productCategory || 'Inventory',
      description: `Murabaha financing approved: ${financingUuid}`,
      relatedFinancingId: financing._id,
    });

    // Add financed amount to wallet
    const wallet = await Wallet.findOne({ userId: user._id });
    if (wallet) {
      wallet.balance += Number(amount);
      await wallet.save();
    }

    // Notify user
    const notif = NOTIFICATION_TYPES.financingApproved(terms.totalRepaymentAmount, terms.dueDate);
    await createNotification(user._id, notif.title, notif.message, notif.type, txnId, financing._id.toString());

    return sendSuccess(res, {
      financing,
      terms,
      transactionId: txnId,
    }, 'Murabaha financing approved successfully.', 201);
  } catch (err) { next(err); }
};

exports.getActiveFinancing = async (req, res, next) => {
  try {
    const records = await FinancingRecord.find({ userId: req.user._id, status: 'active' })
      .sort({ createdAt: -1 });
    return sendSuccess(res, { records });
  } catch (err) { next(err); }
};

exports.getFinancingHistory = async (req, res, next) => {
  try {
    const records = await FinancingRecord.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    return sendSuccess(res, { records });
  } catch (err) { next(err); }
};

exports.getFinancingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid ID.', 400);

    const financing = await FinancingRecord.findById(id);
    if (!financing) return sendError(res, 'Financing record not found.', 404);

    // Ownership check
    if (req.user.role !== 'admin' && financing.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    return sendSuccess(res, { financing });
  } catch (err) { next(err); }
};

// POST /api/repayments/pay
exports.makeRepayment = async (req, res, next) => {
  try {
    const { financingId, amount, paymentMethod } = req.body;
    if (!isValidObjectId(financingId)) return sendError(res, 'Invalid financing ID.', 400);

    const financing = await FinancingRecord.findById(financingId);
    if (!financing) return sendError(res, 'Financing record not found.', 404);

    if (financing.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    if (financing.status !== 'active') {
      return sendError(res, 'Financing is not active.', 400);
    }

    const repayAmount = Number(amount) || financing.remainingBalance;
    if (repayAmount <= 0) return sendError(res, 'Repayment amount must be greater than zero.', 400);

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < repayAmount) {
      return sendError(res, 'Insufficient wallet balance for repayment.', 400);
    }

    // Deduct from wallet
    wallet.balance -= repayAmount;
    await wallet.save();

    // Update financing record
    financing.repaidAmount += repayAmount;
    financing.remainingBalance -= repayAmount;
    if (financing.remainingBalance <= 0) {
      financing.status = 'completed';
      financing.remainingBalance = 0;
    }
    await financing.save();

    // Atomically restore available credit
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { availableCredit: repayAmount }
    });

    await CreditLimitHistory.create({
      userId: req.user._id,
      previousLimit: req.user.availableCredit,
      newLimit: req.user.availableCredit + repayAmount,
      changeReason: 'repayment',
      triggeredBy: 'repayment_processing',
    });

    const txnId = generateTransactionId();
    await Transaction.create({
      transactionId: txnId,
      senderId: req.user._id,
      amount: repayAmount,
      type: 'repayment',
      status: 'successful',
      category: 'Repayment',
      description: `Repayment for ${financing.financingUuid}`,
      relatedFinancingId: financing._id,
    });

    const notif = NOTIFICATION_TYPES.repaymentConfirmed(repayAmount);
    await createNotification(req.user._id, notif.title, notif.message, notif.type, txnId, financingId);

    // Trigger credit limit engine recalculation after repayment (non-blocking)
    recalculateCreditLimit(req.user._id).catch(err =>
      console.error('[CreditEngine] Post-repayment recalc error:', err.message)
    );

    return sendSuccess(res, {
      financing,
      newBalance: wallet.balance,
      transactionId: txnId,
    }, 'Repayment successful. Credit restored.');
  } catch (err) { next(err); }
};
