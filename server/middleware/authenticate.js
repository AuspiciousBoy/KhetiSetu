const { verifyAccessToken } = require('../utils/tokens');
const { error } = require('../utils/response');

/**
 * Validates JWT Access Token from Authorization header (Bearer <token>)
 * Extracts authoritative user identity and attaches to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(
      res,
      'Authentication credentials required. Please provide a valid Bearer token.',
      'UNAUTHORIZED',
      401
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // Derive identity strictly from the verified token
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(
        res,
        'Access token expired. Please refresh your session.',
        'TOKEN_EXPIRED',
        401
      );
    }
    return error(
      res,
      'Invalid or revoked authentication token.',
      'INVALID_TOKEN',
      401
    );
  }
};

module.exports = authenticate;
