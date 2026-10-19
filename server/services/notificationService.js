const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Dispatch notification to a user with daily quota checks
 */
const createNotification = async ({ userId, type, title, body, link }) => {
  try {
    // Check daily frequency to prevent notification spam
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const countToday = await Notification.countDocuments({
      userId,
      createdAt: { $gt: oneDayAgo },
    });

    if (countToday >= 50) {
      logger.warn('User notification limit reached for today', { userId });
      return null;
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      link,
    });

    return notification;
  } catch (err) {
    logger.error('Failed to create notification', { error: err.message, userId, type });
    return null;
  }
};

/**
 * List user notifications
 */
const getUserNotifications = async (userId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return { notifications, total, unreadCount, page, limit };
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { isRead: true } },
    { returnDocument: 'after' }
  );
  return notification;
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
  return { message: 'All notifications marked as read' };
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
