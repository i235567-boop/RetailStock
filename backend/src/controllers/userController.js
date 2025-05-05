const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/helpers');

exports.getProfile = async (req, res) => {
  return sendSuccess(res, { user: req.user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'businessName', 'businessType', 'businessAddress', 'businessLat', 'businessLong', 'bankIban'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Prevent role/status/balance changes
    delete updates.role;
    delete updates.status;
    delete updates.availableCredit;
    delete updates.totalCreditLimit;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-passwordHash');
    return sendSuccess(res, { user }, 'Profile updated.');
  } catch (err) {
    next(err);
  }
};
