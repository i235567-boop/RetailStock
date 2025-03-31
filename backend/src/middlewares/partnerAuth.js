const crypto = require('crypto');
const Partner = require('../models/Partner');
const { sendError } = require('../utils/helpers');

/**
 * Partner API Authentication Middleware
 * Validates HMAC-SHA256 signed partner API key with timestamp to prevent replay attacks
 * Requirement: "Partner API requests must be signed with HMAC-SHA256 with timestamps"
 */
const authenticatePartner = async (req, res, next) => {
  try {
    const apiKey      = req.headers['x-partner-api-key'];
    const signature   = req.headers['x-partner-signature'];
    const timestamp   = req.headers['x-partner-timestamp'];

    if (!apiKey || !signature || !timestamp) {
      return sendError(res, 'Partner authentication required. Missing headers.', 401);
    }

    // Replay attack prevention: reject requests older than 5 minutes
    const requestTime = parseInt(timestamp, 10);
    const now         = Date.now();
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return sendError(res, 'Request timestamp expired. Possible replay attack.', 401);
    }

    // Hash the incoming API key to look up partner
    const apiKeyHash = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');

    const partner = await Partner.findOne({ apiKeyHash, status: 'active' });
    if (!partner) {
      return sendError(res, 'Invalid or inactive partner API key.', 401);
    }

    // Verify HMAC-SHA256 signature
    const payload       = `${timestamp}:${req.method}:${req.path}:${JSON.stringify(req.body || {})}`;
    const expectedSig   = crypto
      .createHmac('sha256', process.env.PARTNER_API_KEY_SECRET || 'partner_secret')
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return sendError(res, 'Invalid partner request signature.', 401);
    }

    req.partner = partner;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticatePartner };
