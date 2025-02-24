const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/helpers');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Authentication token missing.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Session expired. Please log in again.', 401);
      }
      return sendError(res, 'Invalid authentication token.', 401);
    }

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return sendError(res, 'User not found.', 401);
    }

    if (user.status === 'blocked') {
      return sendError(res, 'Your account has been blocked. Contact support.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Auth middleware that also allows blocked users (for reading profile/notifications)
const authenticateAllowBlocked = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required.', 401);
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return sendError(res, 'Invalid or expired token.', 401);
    }
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) return sendError(res, 'User not found.', 401);
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, authenticateAllowBlocked };
