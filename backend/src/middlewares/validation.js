const { sendError, isValidObjectId } = require('../utils/helpers');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName];
  if (!isValidObjectId(id)) {
    return sendError(res, `Invalid ${paramName} format.`, 400);
  }
  next();
};

const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return sendError(res, 'Validation failed.', 400, errors);
  }
  next();
};

module.exports = { validateObjectId, validateBody };
