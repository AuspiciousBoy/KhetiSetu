const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const farmerRoutes = require('./farmerRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');
const orderRoutes = require('./orderRoutes');
const marketRoutes = require('./marketRoutes');
const weatherRoutes = require('./weatherRoutes');
const aiRoutes = require('./aiRoutes');
const logisticsRoutes = require('./logisticsRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);
router.use('/farmer', farmerRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/orders', orderRoutes);
router.use('/market', marketRoutes);
router.use('/weather', weatherRoutes);
router.use('/ai', aiRoutes);
router.use('/logistics', logisticsRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
