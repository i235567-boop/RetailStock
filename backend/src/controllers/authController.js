const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { sendSuccess, sendError } = require('../utils/helpers');
const { createNotification } = require('../utils/notificationHelper');

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, businessName, businessType, businessAddress, cnicNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 'Email already registered.', 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name, email, passwordHash, phone,
      businessName: businessName || '',
      businessType: businessType || 'kirana',
      businessAddress: businessAddress || '',
      cnicNumber: cnicNumber || undefined,
      kycStatus: 'pending',
      totalCreditLimit: 50000,
      availableCredit: 50000,
    });

    // Auto-create wallet
    await Wallet.create({ userId: user._id, balance: 0 });

    await createNotification(user._id, 'Welcome to RetailStock!',
      'Your account has been created. Your initial credit limit is PKR 50,000. Complete KYC to unlock full features.',
      'account');

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    return sendSuccess(res, {
      token,
      refreshToken,
      user: user.toSafeObject(),
    }, 'Registration successful.', 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendError(res, 'Invalid email or password.', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 'Invalid email or password.', 401);

    if (user.status === 'blocked') {
      return sendError(res, 'Your account has been blocked. Contact support.', 403);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    return sendSuccess(res, {
      token,
      refreshToken,
      user: user.toSafeObject(),
    }, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  return sendSuccess(res, {}, 'Logged out successfully.');
};

exports.getMe = async (req, res) => {
  return sendSuccess(res, { user: req.user });
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token required.', 400);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      return sendError(res, 'Invalid or expired refresh token.', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status === 'blocked') return sendError(res, 'User not found or blocked.', 401);

    const newToken = generateToken(user._id, user.role);
    return sendSuccess(res, { token: newToken }, 'Token refreshed.');
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return sendError(res, 'Current password is incorrect.', 400);

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    await user.save();

    return sendSuccess(res, {}, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};
