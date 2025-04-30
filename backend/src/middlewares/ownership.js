const { sendError, isValidObjectId } = require('../utils/helpers');

/**
 * Ownership middleware factory
 * Checks that a resource's userId matches req.user._id (unless admin)
 * Requirement: "User cannot access another user's wallet/expenses/budgets/financing"
 */
const checkOwnership = (Model, resourceName = 'Resource') => async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, `Invalid ${resourceName} ID.`, 400);

    const resource = await Model.findById(id);
    if (!resource) return sendError(res, `${resourceName} not found.`, 404);

    // Admin can access everything
    if (req.user.role === 'admin') {
      req.resource = resource;
      return next();
    }

    const ownerId = resource.userId?.toString() || resource.senderId?.toString();
    if (ownerId !== req.user._id.toString()) {
      return sendError(res, `Access denied. This ${resourceName} does not belong to you.`, 403);
    }

    req.resource = resource;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkOwnership };
