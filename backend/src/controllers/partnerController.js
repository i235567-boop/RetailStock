const User = require('../models/User');
const FinancingRecord = require('../models/FinancingRecord');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError, generateTransactionId, generateFinancingUuid } = require('../utils/helpers');
const { calculateMurabaha } = require('../utils/murabahaCalculator');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

/**
 * Partner API: Get financing quote
 * POST /api/v1/partners/quote
 * Requirement: "REST-based B2B APIs: real-time credit decisions (<500ms)"
 */
exports.partnerQuote = async (req, res, next) => {
  try {
    const { retailerId, cartAmount, durationDays = 14 } = req.body;

    if (!retailerId || !cartAmount) {
      return sendError(res, 'retailerId and cartAmount are required.', 400);
    }
    if (!['7','14','21','30'].includes(String(durationDays))) {
      return sendError(res, 'durationDays must be 7, 14, 21, or 30.', 400);
    }

    const user = await User.findById(retailerId);
    if (!user || user.status !== 'active') {
      return sendError(res, 'Retailer not found or inactive.', 404);
    }

    if (Number(cartAmount) > user.availableCredit) {
      return sendSuccess(res, {
        eligible: false,
        availableCredit: user.availableCredit,
        message: `Cart amount exceeds available credit of PKR ${user.availableCredit}`,
      }, 'Quote generated.');
    }

    const terms = calculateMurabaha(Number(cartAmount), Number(durationDays));

    return sendSuccess(res, {
      eligible: true,
      retailerId,
      availableCredit: user.availableCredit,
      terms,
      partnerId: req.partner._id,
    }, 'Financing quote generated.');
  } catch (err) {
    next(err);
  }
};

/**
 * Partner API: Execute confirmed financing
 * POST /api/v1/partners/execute
 * Requirement: "Partner executes confirmed financing"
 */
exports.partnerExecute = async (req, res, next) => {
  try {
    const { retailerId, cartAmount, durationDays, orderReference, productCategory } = req.body;

    if (!retailerId || !cartAmount || !durationDays) {
      return sendError(res, 'retailerId, cartAmount, and durationDays are required.', 400);
    }

    const user = await User.findById(retailerId);
    if (!user || user.status !== 'active') {
      return sendError(res, 'Retailer not found or inactive.', 404);
    }

    if (Number(cartAmount) > user.availableCredit) {
      return sendError(res, `Amount exceeds available credit of PKR ${user.availableCredit}.`, 400);
    }

    // Check velocity: max 3 financing per week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyCount = await FinancingRecord.countDocuments({
      userId: user._id,
      createdAt: { $gte: oneWeekAgo },
      status: { $in: ['active', 'pending'] },
    });
    if (weeklyCount >= 3) {
      return sendError(res, 'Velocity limit: max 3 financing per week.', 400);
    }

    // Calculate Murabaha on backend
    const terms = calculateMurabaha(Number(cartAmount), Number(durationDays));
    const financingUuid = generateFinancingUuid();

    const financing = await FinancingRecord.create({
      financingUuid,
      userId: user._id,
      partnerId: req.partner._id,
      orderReference: orderReference || `PARTNER-${Date.now()}`,
      status: 'active',
      purpose: 'inventory',
      productCategory: productCategory || 'General',
      costPrice: terms.costPrice,
      profitMarkup: terms.profitMarkup,
      totalRepaymentAmount: terms.totalRepaymentAmount,
      financingDate: new Date(),
      dueDate: terms.dueDate,
      durationDays: terms.durationDays,
      remainingBalance: terms.totalRepaymentAmount,
      markupRate: terms.markupRate,
      digitalSignature: `PARTNER-SIG-${financingUuid}-${Date.now()}`,
    });

    // Atomically decrease available credit
    await User.findByIdAndUpdate(user._id, { $inc: { availableCredit: -Number(cartAmount) } });

    // Add financed amount to wallet
    const wallet = await Wallet.findOne({ userId: user._id });
    if (wallet) {
      wallet.balance += Number(cartAmount);
      await wallet.save();
    }

    const txnId = generateTransactionId();
    await Transaction.create({
      transactionId: txnId,
      receiverId: user._id,
      amount: Number(cartAmount),
      type: 'financing_settlement',
      status: 'successful',
      category: productCategory || 'Inventory',
      description: `Partner financing: ${financingUuid} via ${req.partner.partnerName}`,
      relatedFinancingId: financing._id,
    });

    const notif = NOTIFICATION_TYPES.financingApproved(terms.totalRepaymentAmount, terms.dueDate);
    await createNotification(user._id, notif.title, notif.message, notif.type, txnId, financing._id.toString());

    return sendSuccess(res, {
      financingUuid,
      financingId: financing._id,
      terms,
      transactionId: txnId,
    }, 'Financing executed successfully.', 201);
  } catch (err) {
    next(err);
  }
};
