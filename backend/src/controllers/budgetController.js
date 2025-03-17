const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { sendSuccess, sendError, isValidObjectId, getCurrentMonth, getMonthStart, getMonthEnd } = require('../utils/helpers');

exports.createBudget = async (req, res, next) => {
  try {
    const { month, totalLimit, categoryLimits, warningThreshold } = req.body;
    const m = month || getCurrentMonth();

    if (!totalLimit || Number(totalLimit) <= 0) return sendError(res, 'Total limit must be > 0.', 400);

    const existing = await Budget.findOne({ userId: req.user._id, month: m });
    if (existing) return sendError(res, 'Budget for this month already exists. Use update instead.', 409);

    const budget = await Budget.create({
      userId: req.user._id,
      month: m,
      totalLimit: Number(totalLimit),
      categoryLimits: categoryLimits || [],
      warningThreshold: warningThreshold || 80,
    });

    return sendSuccess(res, { budget }, 'Budget created.', 201);
  } catch (err) { next(err); }
};

exports.listBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id }).sort({ month: -1 });
    return sendSuccess(res, { budgets });
  } catch (err) { next(err); }
};

exports.getCurrentBudget = async (req, res, next) => {
  try {
    const month = getCurrentMonth();
    const budget = await Budget.findOne({ userId: req.user._id, month });

    // Calculate live status from backend data
    if (budget) {
      const start = getMonthStart(month);
      const end = getMonthEnd(month);
      const spent = await Expense.aggregate([
        { $match: { userId: req.user._id, date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      budget.spentAmount = spent[0]?.total || 0;
      const pct = (budget.spentAmount / budget.totalLimit) * 100;
      budget.status = pct >= 100 ? 'exceeded' : pct >= budget.warningThreshold ? 'nearLimit' : 'safe';
      await budget.save();
    }

    return sendSuccess(res, { budget, month });
  } catch (err) { next(err); }
};

exports.updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid budget ID.', 400);

    const budget = await Budget.findById(id);
    if (!budget) return sendError(res, 'Budget not found.', 404);
    if (budget.userId.toString() !== req.user._id.toString()) return sendError(res, 'Access denied.', 403);

    const allowed = ['totalLimit', 'categoryLimits', 'warningThreshold'];
    allowed.forEach(f => { if (req.body[f] !== undefined) budget[f] = req.body[f]; });
    await budget.save();

    return sendSuccess(res, { budget }, 'Budget updated.');
  } catch (err) { next(err); }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid budget ID.', 400);

    const budget = await Budget.findById(id);
    if (!budget) return sendError(res, 'Budget not found.', 404);
    if (budget.userId.toString() !== req.user._id.toString()) return sendError(res, 'Access denied.', 403);

    await budget.deleteOne();
    return sendSuccess(res, {}, 'Budget deleted.');
  } catch (err) { next(err); }
};
