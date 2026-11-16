const adminService = require('../services/adminService');
const { success, paginated } = require('../utils/response');
const { verifySmtpConnection, sendEmail } = require('../integrations/emailService');
const emailConfig = require('../config/emailConfig');

const getOverview = async (req, res, next) => {
  try {
    const data = await adminService.getPlatformOverview();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const result = await adminService.listUsers({
      page: Number(page),
      limit: Number(limit),
      role,
      search,
    });
    return paginated(res, result.users, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const updated = await adminService.updateUserStatus({
      targetUserId: req.params.id,
      isActive: req.body.isActive,
      role: req.body.role,
      req,
    });
    return success(res, updated, 'User status updated');
  } catch (err) {
    next(err);
  }
};

const moderateProduct = async (req, res, next) => {
  try {
    const moderated = await adminService.moderateProduct({
      productId: req.params.id,
      newStatus: req.body.status,
      reason: req.body.reason,
      req,
    });
    return success(res, moderated, 'Product moderation status updated');
  } catch (err) {
    next(err);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, action, actorEmail, result } = req.query;
    const data = await adminService.getAuditLogs({
      page: Number(page),
      limit: Number(limit),
      action,
      actorEmail,
      result,
    });
    return paginated(res, data.logs, {
      page: data.page,
      limit: data.limit,
      total: data.total,
    });
  } catch (err) {
    next(err);
  }
};

const getSmtpStatus = async (req, res, next) => {
  try {
    const verification = await verifySmtpConnection();
    const maskedUser = emailConfig.user
      ? `${emailConfig.user.substring(0, 3)}***@${emailConfig.user.split('@')[1] || ''}`
      : 'Not configured';

    return success(
      res,
      {
        enabled: emailConfig.enabled,
        host: emailConfig.host,
        port: emailConfig.port,
        configuredUser: maskedUser,
        from: emailConfig.from,
        connected: verification.success,
        details: verification,
      },
      'SMTP diagnostic check completed'
    );
  } catch (err) {
    next(err);
  }
};

const sendTestEmail = async (req, res, next) => {
  try {
    const to = req.body?.to || req.user?.email || emailConfig.adminEmail;
    if (!to) {
      return res.status(400).json({
        success: false,
        error: { code: 'RECIPIENT_REQUIRED', message: 'Target email recipient is required.' },
      });
    }

    const result = await sendEmail({
      to,
      template: 'admin-alert',
      subject: '🌾 KhetiSetu SMTP Test Dispatch',
      context: {
        alertTitle: 'SMTP Configuration Verified',
        severity: 'INFO',
        message: `This is a test notification confirming that KhetiSetu email dispatch is fully operational on ${new Date().toLocaleString('en-IN')}.`,
        details: {
          host: emailConfig.host,
          port: emailConfig.port,
          sender: emailConfig.from,
        },
      },
    });

    if (result && result.success) {
      return success(res, { messageId: result.messageId, to }, `Test email delivered successfully to ${to}`);
    } else {
      return res.status(502).json({
        success: false,
        error: {
          code: 'EMAIL_DISPATCH_FAILED',
          message: result?.error || 'Failed to dispatch email via configured SMTP server.',
        },
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverview,
  listUsers,
  updateUserStatus,
  moderateProduct,
  getAuditLogs,
  getSmtpStatus,
  sendTestEmail,
};
