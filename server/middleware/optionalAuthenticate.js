const { verifyAccessToken } = require('../utils/tokens');

/**
 * Optional Authentication Middleware
 * If a valid Bearer token is provided, attaches req.user.
 * If no token is provided, proceeds as guest (req.user = undefined).
 */
const optionalAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    // If token is invalid or expired, continue as guest
    req.user = null;
  }

  next();
};

module.exports = optionalAuthenticate;
