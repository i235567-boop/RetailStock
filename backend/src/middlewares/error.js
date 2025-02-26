const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ status: 'error', message: 'Validation failed.', errors });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ status: 'error', message: `${field} already exists.` });
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    return res.status(400).json({ status: 'error', message: 'Invalid ID format.' });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error.'
    : err.message || 'Internal server error.';

  res.status(statusCode).json({ status: 'error', message });
};

const notFound = (req, res) => {
  res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found.` });
};

module.exports = { errorHandler, notFound };
