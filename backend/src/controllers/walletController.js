const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { sendSuccess, sendError, generateTransactionId } = require('../utils/helpers');
const { checkSuspiciousRules } = require('../utils/suspiciousRules');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return sendError(res, 'Wallet not found.', 404);
    return sendSuccess(res, { wallet });
  } catch (err) { next(err); }
};

exports.getWalletSummary = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return sendError(res, 'Wallet not found.', 404);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTxns = await Transaction.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
      createdAt: { $gte: thirtyDaysAgo },
      status: 'successful'
    }).sort({ createdAt: -1 }).limit(5);

    return sendSuccess(res, { wallet, recentTransactions: recentTxns });
  } catch (err) { next(err); }
};

exports.deposit = async (req, res, next) => {
  try {
    const { amount, description, category } = req.body;

    // Backend validates: amount must be > 0
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return sendError(res, 'Deposit amount must be greater than zero.', 400);
    }
    const depositAmount = Number(amount);

    if (req.user.status === 'blocked') {
      return sendError(res, 'Blocked accounts cannot make deposits.', 403);
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return sendError(res, 'Wallet not found.', 404);
    if (wallet.status === 'frozen') return sendError(res, 'Wallet is frozen.', 403);

    const txnId = generateTransactionId();

    // Check suspicious rules
    const tempTxn = { type: 'deposit', amount: depositAmount };
    const suspiciousReasons = await checkSuspiciousRules(tempTxn, req.user);
    const isSuspicious = suspiciousReasons.length > 0;
    const txnStatus = isSuspicious ? 'flagged' : 'successful';

    // Create transaction record FIRST
    const transaction = await Transaction.create({
      transactionId: txnId,
      receiverId: req.user._id,
      amount: depositAmount,
      type: 'deposit',
      status: txnStatus,
      category: category || 'General',
      description: description || 'Wallet deposit',
      suspiciousFlag: isSuspicious,
      suspiciousReasons,
    });

    // Update wallet balance ONLY in backend
    wallet.balance += depositAmount;
    wallet.totalDeposits += depositAmount;
    await wallet.save();

    // Notifications
    const notifData = NOTIFICATION_TYPES.transactionSuccess(depositAmount, 'deposit');
    await createNotification(req.user._id, notifData.title, notifData.message, notifData.type, txnId);

    if (wallet.balance < 5000) {
      const lowNotif = NOTIFICATION_TYPES.lowBalance(wallet.balance);
      await createNotification(req.user._id, lowNotif.title, lowNotif.message, lowNotif.type);
    }

    if (isSuspicious) {
      const suspNotif = NOTIFICATION_TYPES.suspiciousActivity(suspiciousReasons[0]);
      await createNotification(req.user._id, suspNotif.title, suspNotif.message, suspNotif.type, txnId);
    }

    return sendSuccess(res, { transaction, newBalance: wallet.balance }, 'Deposit successful.');
  } catch (err) { next(err); }
};

exports.withdraw = async (req, res, next) => {
  try {
    const { amount, description, category } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return sendError(res, 'Withdrawal amount must be greater than zero.', 400);
    }
    const withdrawAmount = Number(amount);

    if (req.user.status === 'blocked') {
      return sendError(res, 'Blocked accounts cannot make withdrawals.', 403);
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) return sendError(res, 'Wallet not found.', 404);
    if (wallet.status === 'frozen') return sendError(res, 'Wallet is frozen.', 403);

    // Backend checks sufficient balance
    if (wallet.balance < withdrawAmount) {
      // Record failed attempt for suspicious monitoring
      await Transaction.create({
        transactionId: generateTransactionId(),
        senderId: req.user._id,
        amount: withdrawAmount,
        type: 'withdrawal',
        status: 'failed',
        category: category || 'General',
        description: 'Withdrawal failed: insufficient balance',
        suspiciousFlag: false,
        suspiciousReasons: [],
      });
      return sendError(res, 'Insufficient wallet balance.', 400);
    }

    const txnId = generateTransactionId();
    const tempTxn = { type: 'withdrawal', amount: withdrawAmount };
    const suspiciousReasons = await checkSuspiciousRules(tempTxn, req.user);
    const isSuspicious = suspiciousReasons.length > 0;

    const transaction = await Transaction.create({
      transactionId: txnId,
      senderId: req.user._id,
      amount: withdrawAmount,
      type: 'withdrawal',
      status: isSuspicious ? 'flagged' : 'successful',
      category: category || 'General',
      description: description || 'Wallet withdrawal',
      suspiciousFlag: isSuspicious,
      suspiciousReasons,
    });

    // Update wallet ONLY in backend
    wallet.balance -= withdrawAmount;
    wallet.totalWithdrawals += withdrawAmount;
    await wallet.save();

    const notifData = NOTIFICATION_TYPES.transactionSuccess(withdrawAmount, 'withdrawal');
    await createNotification(req.user._id, notifData.title, notifData.message, notifData.type, txnId);

    if (wallet.balance < 5000) {
      const lowNotif = NOTIFICATION_TYPES.lowBalance(wallet.balance);
      await createNotification(req.user._id, lowNotif.title, lowNotif.message, lowNotif.type);
    }

    return sendSuccess(res, { transaction, newBalance: wallet.balance }, 'Withdrawal successful.');
  } catch (err) { next(err); }
};

exports.transfer = async (req, res, next) => {
  try {
    const { receiverEmail, amount, description, category } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return sendError(res, 'Transfer amount must be greater than zero.', 400);
    }
    const transferAmount = Number(amount);

    if (req.user.status === 'blocked') {
      return sendError(res, 'Blocked accounts cannot make transfers.', 403);
    }

    // Find receiver
    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) return sendError(res, 'Receiver not found.', 404);

    // Cannot transfer to self
    if (receiver._id.toString() === req.user._id.toString()) {
      return sendError(res, 'Cannot transfer to your own account.', 400);
    }

    if (receiver.status === 'blocked') {
      return sendError(res, 'Receiver account is blocked.', 400);
    }

    const senderWallet = await Wallet.findOne({ userId: req.user._id });
    const receiverWallet = await Wallet.findOne({ userId: receiver._id });

    if (!senderWallet || !receiverWallet) return sendError(res, 'Wallet not found.', 404);

    // Backend checks sufficient balance
    if (senderWallet.balance < transferAmount) {
      return sendError(res, 'Insufficient wallet balance.', 400);
    }

    const txnId = generateTransactionId();
    const tempTxn = { type: 'transfer', amount: transferAmount };
    const suspiciousReasons = await checkSuspiciousRules(tempTxn, req.user);
    const isSuspicious = suspiciousReasons.length > 0;

    const transaction = await Transaction.create({
      transactionId: txnId,
      senderId: req.user._id,
      receiverId: receiver._id,
      amount: transferAmount,
      type: 'transfer',
      status: isSuspicious ? 'flagged' : 'successful',
      category: category || 'Transfer',
      description: description || `Transfer to ${receiver.name}`,
      suspiciousFlag: isSuspicious,
      suspiciousReasons,
    });

    // Update BOTH wallets ONLY in backend
    senderWallet.balance -= transferAmount;
    senderWallet.totalTransfersOut += transferAmount;
    await senderWallet.save();

    receiverWallet.balance += transferAmount;
    receiverWallet.totalTransfersIn += transferAmount;
    await receiverWallet.save();

    // Notify both parties
    await createNotification(req.user._id, 'Transfer Sent',
      `PKR ${transferAmount.toLocaleString()} transferred to ${receiver.name}.`, 'transaction', txnId);
    await createNotification(receiver._id, 'Transfer Received',
      `PKR ${transferAmount.toLocaleString()} received from ${req.user.name}.`, 'transaction', txnId);

    if (isSuspicious) {
      await createNotification(req.user._id, 'Transaction Flagged',
        `Your transfer was flagged: ${suspiciousReasons[0]}`, 'security', txnId);
    }

    return sendSuccess(res, { transaction, newBalance: senderWallet.balance }, 'Transfer successful.');
  } catch (err) { next(err); }
};
