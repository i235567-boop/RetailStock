/**
 * Request logging middleware
 * Requirement: "Records request activity for debugging and audit"
 * NOTE: Passwords, tokens, and secrets are never logged
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId   = req.user ? req.user._id : 'guest';
    // Never log Authorization header or password fields
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} | ${duration}ms | user:${userId}`
    );
  });
  next();
};

module.exports = { requestLogger };
