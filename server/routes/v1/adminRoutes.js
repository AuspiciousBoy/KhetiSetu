const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { adminLimiter } = require('../../config/rateLimits');

// All admin routes strictly require ADMIN role and are protected by adminLimiter
router.use(authenticate, authorize('ADMIN'), adminLimiter);

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.listUsers);
router.patch('/users/:id', adminController.updateUserStatus);
router.patch('/products/:id/moderate', adminController.moderateProduct);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
