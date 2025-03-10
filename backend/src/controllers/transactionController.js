const Transaction = require('../models/Transaction');
const { sendSuccess, sendError, isValidObjectId } = require('../utils/helpers');

exports.listTransactions = async (req, res, next) => {
  try {
    const { type, status, category, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
    };

    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$and = [
        { $or: [{ senderId: req.user._id }, { receiverId: req.user._id }] },
        { $or: [
          { transactionId: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]}
      ];
      delete query.$or;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('senderId', 'name email')
        .populate('receiverId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(query)
    ]);

    return sendSuccess(res, { transactions }, 'Transactions retrieved.', 200, {
      page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit))
    });
  } catch (err) { next(err); }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid transaction ID.', 400);

    const transaction = await Transaction.findById(id)
      .populate('senderId', 'name email businessName')
      .populate('receiverId', 'name email businessName');

    if (!transaction) return sendError(res, 'Transaction not found.', 404);

    // Users can only see own transactions; admin can see all
    if (req.user.role !== 'admin') {
      const isOwner = transaction.senderId?._id?.toString() === req.user._id.toString() ||
                      transaction.receiverId?._id?.toString() === req.user._id.toString();
      if (!isOwner) return sendError(res, 'Access denied.', 403);
    }

    return sendSuccess(res, { transaction });
  } catch (err) { next(err); }
};

exports.getMonthlySummary = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const summary = await Transaction.aggregate([
      {
        $match: {
          $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
          status: 'successful',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return sendSuccess(res, { summary });
  } catch (err) { next(err); }
};
