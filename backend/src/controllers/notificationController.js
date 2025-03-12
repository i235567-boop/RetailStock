const Notification = require('../models/Notification');
const { sendSuccess, sendError, isValidObjectId } = require('../utils/helpers');

exports.listNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unread] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, readStatus: false }),
    ]);

    return sendSuccess(res, { notifications, unreadCount: unread }, 'Notifications retrieved.', 200, { total });
  } catch (err) { next(err); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 'Invalid notification ID.', 400);

    const notif = await Notification.findById(id);
    if (!notif) return sendError(res, 'Notification not found.', 404);
    if (notif.userId.toString() !== req.user._id.toString()) return sendError(res, 'Access denied.', 403);

    notif.readStatus = true;
    await notif.save();
    return sendSuccess(res, { notification: notif }, 'Marked as read.');
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, readStatus: false }, { readStatus: true });
    return sendSuccess(res, {}, 'All notifications marked as read.');
  } catch (err) { next(err); }
};
