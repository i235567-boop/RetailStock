const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { status: 'error', message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { status: 'error', message: 'Too many authentication attempts. Try again in a minute.' },
});

const financingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { status: 'error', message: 'Too many financing requests. Please slow down.' },
});

module.exports = { generalLimiter, authLimiter, financingLimiter };
