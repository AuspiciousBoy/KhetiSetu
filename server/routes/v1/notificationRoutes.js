const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notificationController');
const authenticate = require('../../middleware/authenticate');

router.use(authenticate);

router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;
