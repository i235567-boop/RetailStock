const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { sendSuccess, sendError, isValidObjectId, getCurrentMonth, getMonthStart, getMonthEnd } = require('../utils/helpers');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationHelper');

const updateBudgetStatus = async (userId) => {
  const month = getCurrentMonth();
  const budget = await Budget.findOne({ userId, month });
  if (!budget) return;

  const monthStart = getMonthStart(month);
  const monthEnd = getMonthEnd(month);

  const totalSpent = await Expense.aggregate([
    { $match: { userId, date: { $gte: monthStart, $lte: monthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const spent = totalSpent[0]?.total || 0;
  budget.spentAmount = spent;
  const usagePercent = (spent / budget.totalLimit) * 100;

  let newStatus = 'safe';
  if (usagePercent >= 100) newStatus = 'exceeded';
  else if (usagePercent >= budget.warningThreshold) newStatus = 'nearLimit';

  if (newStatus !== budget.status) {
    if (newStatus === 'nearLimit') {
      const notif = NOTIFICATION_TYPES.budgetWarning('Monthly', Math.round(usagePercent));
      await createNotification(userId, notif.title, notif.message, notif.type);
    } else if (newStatus === 'exceeded') {
      const notif = NOTIFICATION_TYPES.budgetExceeded('Monthly');
      await createNotification(userId, notif.title, notif.message, notif.type);
    }
  }

  budget.status = newStatus;
  await budget.save();
};

exports.createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, paymentMethod, date, notes } = req.body;
    if (!amount || Number(amount) <= 0) return sendError(res, 'Amount must be greater than zero.', 400);

    const expense = await Expense.create({
      userId: req.user._id,
      title, amount: Number(amount),
      category: category || 'General',
      paymentMethod: paymentMethod || 'Cash',
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
    });

    await updateBudgetStatus(req.user._id);
    return sendSuccess(res, { expense }, 'Expense created.', 201);
  } catch (err) { next(err); }
};

exports.listExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(query).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Expense.countDocuments(query)
    ]);

    return sendSuccess(res, { expenses }, 'Expenses retrieved.', 200, { page: Number(page), total });
  } catch (err) { next(err); }
};

exports.getMonthlySummary = async (req, res, next) => {
  try {
    const { month } = req.query;
    const m = month || getCurrentMonth();
    const start = getMonthStart(m);
    const end = getMonthEnd(m);

    const summary = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    return sendSuccess(res, { month: m, summary: summary[0] || { total: 0, count: 0 } });
  } catch (err) { next(err); }
};

exports.getCategorySummary = async (req, res, next) => {
  try {
    const { month } = req.query;
    const m = month || getCurrentMonth();
    const start = getMonthStart(m);
    const end = getMonthEnd(m);

    const summary = await Expense.aggregate([
      { $match: { userId: req.user._id, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    return sendSuccess(res, { month: m, categories: summary });
  } catch (err) { next(err); }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid expense ID.', 400);

    const expense = await Expense.findById(id);
    if (!expense) return sendError(res, 'Expense not found.', 404);
    if (expense.userId.toString() !== req.user._id.toString()) return sendError(res, 'Access denied.', 403);

    const allowed = ['title', 'amount', 'category', 'paymentMethod', 'date', 'notes'];
    allowed.forEach(f => { if (req.body[f] !== undefined) expense[f] = req.body[f]; });
    if (req.body.amount && Number(req.body.amount) <= 0) return sendError(res, 'Amount must be > 0.', 400);

    await expense.save();
    await updateBudgetStatus(req.user._id);
    return sendSuccess(res, { expense }, 'Expense updated.');
  } catch (err) { next(err); }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid expense ID.', 400);

    const expense = await Expense.findById(id);
    if (!expense) return sendError(res, 'Expense not found.', 404);
    if (expense.userId.toString() !== req.user._id.toString()) return sendError(res, 'Access denied.', 403);

    await expense.deleteOne();
    await updateBudgetStatus(req.user._id);
    return sendSuccess(res, {}, 'Expense deleted.');
  } catch (err) { next(err); }
};
