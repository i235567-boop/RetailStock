const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const FinancingRecord = require('../models/FinancingRecord');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError, isValidObjectId } = require('../utils/helpers');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers, activeUsers, blockedUsers,
      totalTransactions, flaggedTransactions,
      activeFinancing, totalFinancingValue
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', status: 'active' }),
      User.countDocuments({ role: 'user', status: 'blocked' }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ suspiciousFlag: true }),
      FinancingRecord.countDocuments({ status: 'active' }),
      FinancingRecord.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$remainingBalance' } } }
      ]),
    ]);

    const txnVolume = await Transaction.aggregate([
      { $match: { status: 'successful' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return sendSuccess(res, {
      totalUsers, activeUsers, blockedUsers,
      totalTransactions, flaggedTransactions,
      activeFinancing,
      totalFinancingValue: totalFinancingValue[0]?.total || 0,
      transactionVolume: txnVolume[0]?.total || 0,
    });
  } catch (err) { next(err); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const { search, status, role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query)
    ]);

    return sendSuccess(res, { users }, 'Users retrieved.', 200, { total, page: Number(page) });
  } catch (err) { next(err); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid user ID.', 400);

    const user = await User.findById(id).select('-passwordHash');
    if (!user) return sendError(res, 'User not found.', 404);

    const wallet = await Wallet.findOne({ userId: id });
    return sendSuccess(res, { user, wallet });
  } catch (err) { next(err); }
};

exports.blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid user ID.', 400);

    const user = await User.findById(id);
    if (!user) return sendError(res, 'User not found.', 404);
    if (user.role === 'admin') return sendError(res, 'Cannot block admin users.', 400);

    user.status = 'blocked';
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'BLOCK_USER',
      targetType: 'User',
      targetId: id,
      details: { reason: req.body.reason || 'Admin action' },
    });

    const notif = NOTIFICATION_TYPES.accountBlocked();
    await createNotification(user._id, notif.title, notif.message, notif.type);

    return sendSuccess(res, {}, 'User blocked successfully.');
  } catch (err) { next(err); }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid user ID.', 400);

    const user = await User.findById(id);
    if (!user) return sendError(res, 'User not found.', 404);

    user.status = 'active';
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'UNBLOCK_USER',
      targetType: 'User',
      targetId: id,
      details: { reason: 'Admin action' },
    });

    await createNotification(user._id, 'Account Reinstated',
      'Your account has been unblocked. You can now use all services.', 'account');

    return sendSuccess(res, {}, 'User unblocked successfully.');
  } catch (err) { next(err); }
};

exports.listWallets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [wallets, total] = await Promise.all([
      Wallet.find().populate('userId', 'name email status businessName').sort({ balance: -1 }).skip(skip).limit(Number(limit)),
      Wallet.countDocuments()
    ]);
    return sendSuccess(res, { wallets }, 'Wallets retrieved.', 200, { total });
  } catch (err) { next(err); }
};

exports.listAllTransactions = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 20, startDate, endDate } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('senderId', 'name email').populate('receiverId', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query)
    ]);

    return sendSuccess(res, { transactions }, 'Transactions retrieved.', 200, { total });
  } catch (err) { next(err); }
};

exports.getFlaggedTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find({ suspiciousFlag: true })
        .populate('senderId', 'name email businessName').populate('receiverId', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments({ suspiciousFlag: true })
    ]);
    return sendSuccess(res, { transactions }, 'Flagged transactions retrieved.', 200, { total });
  } catch (err) { next(err); }
};

exports.getFinancingPortfolio = async (req, res, next) => {
  try {
    const records = await FinancingRecord.find()
      .populate('userId', 'name email businessName riskTier')
      .sort({ createdAt: -1 });

    // Risk scoring: red = overdue, yellow = due within 3 days, green = ok
    const scored = records.map(r => {
      const now = new Date();
      const daysUntilDue = (new Date(r.dueDate) - now) / (1000 * 60 * 60 * 24);
      let riskColor = 'green';
      if (r.status === 'active' && daysUntilDue < 0) riskColor = 'red';
      else if (r.status === 'active' && daysUntilDue <= 3) riskColor = 'yellow';
      return { ...r.toObject(), riskColor, daysUntilDue: Math.round(daysUntilDue) };
    });

    return sendSuccess(res, { records: scored });
  } catch (err) { next(err); }
};

exports.getSystemReports = async (req, res, next) => {
  try {
    const txnVolume = await Transaction.aggregate([
      { $match: { status: 'successful' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          volume: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const walletBalance = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    return sendSuccess(res, { txnVolume, totalSystemBalance: walletBalance[0]?.total || 0 });
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, type, description } = req.body;
    if (!name || !type) return sendError(res, 'Name and type are required.', 400);

    const category = await Category.create({ name, type, description, createdBy: req.user._id });
    return sendSuccess(res, { category }, 'Category created.', 201);
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid category ID.', 400);

    const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!category) return sendError(res, 'Category not found.', 404);
    return sendSuccess(res, { category }, 'Category updated.');
  } catch (err) { next(err); }
};

exports.disableCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid category ID.', 400);

    const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!category) return sendError(res, 'Category not found.', 404);
    return sendSuccess(res, { category }, 'Category disabled.');
  } catch (err) { next(err); }
};

exports.listAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('actorId', 'name email')
      .sort({ createdAt: -1 }).limit(100);
    return sendSuccess(res, { logs });
  } catch (err) { next(err); }
};
