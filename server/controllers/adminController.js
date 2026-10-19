const adminService = require('../services/adminService');
const { success, paginated } = require('../utils/response');

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

module.exports = {
  getOverview,
  listUsers,
  updateUserStatus,
  moderateProduct,
  getAuditLogs,
};
