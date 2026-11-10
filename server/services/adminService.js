const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const ProduceBatch = require('../models/ProduceBatch');
const AIConversation = require('../models/AIConversation');
const { logAuditEvent } = require('../middleware/auditLogger');
const mongoose = require('mongoose');

/**
 * Get comprehensive system overview metrics
 */
const getPlatformOverview = async () => {
  const [
    totalUsers,
    totalFarmers,
    totalBusinesses,
    totalProducts,
    totalOrders,
    paidOrders,
    recentAuditLogs,
    totalBatches,
    aiConversationsCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'FARMER' }),
    User.countDocuments({ role: 'BUSINESS' }),
    Product.countDocuments({ status: 'ACTIVE' }),
    Order.countDocuments(),
    Order.find({ status: { $ne: 'CANCELLED' } }).select('total'),
    AuditLog.find().sort({ timestamp: -1 }).limit(10),
    ProduceBatch.countDocuments(),
    AIConversation.countDocuments(),
  ]);

  const totalGrossRevenue = paidOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

  return {
    metrics: {
      totalUsers,
      totalFarmers,
      totalConsumers: totalUsers - (totalFarmers + totalBusinesses),
      totalBusinesses,
      totalActiveProducts: totalProducts,
      totalBatchesTracked: totalBatches,
      totalOrders,
      totalGrossRevenue,
      aiConsultationsCount: aiConversationsCount,
    },
    systemHealth: {
      databaseStatus: mongoose.connection.readyState === 1 ? 'HEALTHY_CONNECTED' : 'DISCONNECTED',
      nodeEnvironment: process.env.NODE_ENV,
      serverUptimeSeconds: Math.round(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    recentAuditLogs,
  };
};

/**
 * Manage platform users (paginated, searchable)
 */
const listUsers = async ({ page = 1, limit = 20, role, search }) => {
  const query = {};
  if (role) query.role = role;
  if (search && search.trim()) {
    const safeRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ email: safeRegex }, { fullName: safeRegex }];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users: users.map((u) => u.toPublicJSON()),
    total,
    page,
    limit,
  };
};

/**
 * Update user status (lock/unlock) or role with strict audit logging
 */
const updateUserStatus = async ({ targetUserId, isActive, role, req }) => {
  const user = await User.findById(targetUserId);
  if (!user) throw new Error('Target user not found.');

  const changes = {};
  if (typeof isActive === 'boolean') {
    changes.isActive = isActive;
    user.isActive = isActive;
  }

  if (role && ['FARMER', 'CONSUMER', 'BUSINESS', 'LOGISTICS_OPERATOR'].includes(role)) {
    changes.previousRole = user.role;
    changes.newRole = role;
    user.role = role;
  }

  await user.save();

  await logAuditEvent({
    req,
    action: 'ADMIN_USER_UPDATED',
    resource: 'User',
    resourceId: user._id,
    result: 'SUCCESS',
    metadata: changes,
  });

  return user.toPublicJSON();
};

/**
 * Product moderation
 */
const moderateProduct = async ({ productId, newStatus, reason, req }) => {
  const product = await Product.findById(productId);
  if (!product) throw new Error('Product not found.');

  const previousStatus = product.status;
  product.status = newStatus;
  await product.save();

  await logAuditEvent({
    req,
    action: 'ADMIN_PRODUCT_MODERATED',
    resource: 'Product',
    resourceId: product._id,
    result: 'SUCCESS',
    metadata: { previousStatus, newStatus, reason },
  });

  return product;
};

/**
 * Query immutable audit logs with pagination and filters
 */
const getAuditLogs = async ({ page = 1, limit = 25, action, actorEmail, result }) => {
  const query = {};
  if (action) query.action = action;
  if (actorEmail) query.actorEmail = new RegExp(`^${actorEmail}$`, 'i');
  if (result) query.result = result;

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(query),
  ]);

  return { logs, total, page, limit };
};

module.exports = {
  getPlatformOverview,
  listUsers,
  updateUserStatus,
  moderateProduct,
  getAuditLogs,
};
