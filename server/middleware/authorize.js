const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Role-Based Access Control (RBAC) middleware factory
 * @param  {...string} allowedRoles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return error(res, 'Authentication required before authorization check', 'UNAUTHORIZED', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('RBAC violation attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        route: req.originalUrl,
      });

      return error(
        res,
        'Access forbidden. You do not have sufficient permissions to perform this action.',
        'FORBIDDEN',
        403
      );
    }

    next();
  };
};

module.exports = authorize;
