const { sendError } = require('../utils/helpers');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Access forbidden. Insufficient permissions.', 403);
    }
    next();
  };
};

const requireAdmin = requireRole('admin');

module.exports = { requireRole, requireAdmin };
