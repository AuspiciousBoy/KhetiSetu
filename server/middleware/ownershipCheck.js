const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Object-Level Authorization (OLA) middleware helper
 * Checks if the current authenticated user owns the resource or has administrative bypass.
 *
 * @param {Function} getResourceOwnerId - Callback (req) => Promise<string | null>
 */
const checkOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return error(res, 'Authentication required', 'UNAUTHORIZED', 401);
      }

      // System administrators have audited operational bypass
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const ownerId = await getResourceOwnerId(req);

      if (!ownerId) {
        // Return 404 rather than 403 to prevent resource enumeration
        return error(res, 'Requested resource not found', 'NOT_FOUND', 404);
      }

      if (ownerId.toString() !== req.user.id.toString()) {
        logger.warn('BOLA / Unauthorized resource access blocked', {
          actorId: req.user.id,
          attemptedResourceId: req.params.id,
          route: req.originalUrl,
          requestId: req.id,
        });

        // Return 403 or 404 according to OWASP guidelines
        return error(res, 'You do not have permission to access this resource', 'FORBIDDEN', 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { checkOwnership };
