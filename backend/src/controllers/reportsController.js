const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Wallet = require('../models/Wallet');
const FinancingRecord = require('../models/FinancingRecord');
const { sendSuccess, getCurrentMonth, getMonthStart, getMonthEnd } = require('../utils/helpers');

exports.getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const month = getCurrentMonth();
    const start = getMonthStart(month);
    const end = getMonthEnd(month);

    const [wallet, activeFinancing, recentTxns, monthlyExpenses, budget] = await Promise.all([
      Wallet.findOne({ userId }),
      FinancingRecord.find({ userId, status: 'active' }),
      Transaction.find({ $or: [{ senderId: userId }, { receiverId: userId }], status: 'successful' })
        .sort({ createdAt: -1 }).limit(5).populate('senderId', 'name').populate('receiverId', 'name'),
      Expense.aggregate([
        { $match: { userId, date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Budget.findOne({ userId, month }),
    ]);

    const totalRepaymentDue = activeFinancing.reduce((sum, f) => sum + f.remainingBalance, 0);

    return sendSuccess(res, {
      wallet,
      availableCredit: req.user.availableCredit,
      totalCreditLimit: req.user.totalCreditLimit,
      activeFinancingCount: activeFinancing.length,
      totalRepaymentDue,
      nextDueDate: activeFinancing.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate,
      recentTransactions: recentTxns,
      monthlyExpenses: monthlyExpenses[0]?.total || 0,
      budget: budget || null,
    });
  } catch (err) { next(err); }
};

exports.getIncomeExpense = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const txnData = await Transaction.aggregate([
      {
        $match: {
          $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
          status: 'successful',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, type: '$type' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return sendSuccess(res, { txnData });
  } catch (err) { next(err); }
};

exports.getBudgetUsage = async (req, res, next) => {
  try {
    const month = getCurrentMonth();
    const budget = await Budget.findOne({ userId: req.user._id, month });
    const start = getMonthStart(month);
    const end = getMonthEnd(month);

    const categorySpending = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    return sendSuccess(res, { budget, categorySpending, month });
  } catch (err) { next(err); }
};

exports.getFinancingHistory = async (req, res, next) => {
  try {
    const records = await FinancingRecord.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(12);
    return sendSuccess(res, { records });
  } catch (err) { next(err); }
};
