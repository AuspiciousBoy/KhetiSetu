const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Audit logging helper for recording sensitive security events
 */
const logAuditEvent = async ({
  req,
  actorId,
  actorEmail,
  actorRole,
  action,
  resource,
  resourceId,
  result,
  metadata,
}) => {
  try {
    const entry = {
      actorId: actorId || (req?.user ? req.user.id : undefined),
      actorEmail: actorEmail || (req?.user ? req.user.email : undefined),
      actorRole: actorRole || (req?.user ? req.user.role : undefined),
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : undefined,
      requestId: req?.id,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.headers ? req.headers['user-agent'] : undefined,
      result: result || 'SUCCESS',
      metadata,
    };

    await AuditLog.create(entry);
  } catch (err) {
    // Audit logging failure should be logged to error stream but not crash main business flow
    logger.error('Failed to persist audit log entry', { error: err.message, action, resource });
  }
};

module.exports = { logAuditEvent };
