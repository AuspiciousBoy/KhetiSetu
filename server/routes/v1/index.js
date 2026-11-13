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
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/farmer', farmerRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/orders', orderRoutes);
router.use('/market', marketRoutes);
router.use('/weather', weatherRoutes);
router.use('/ai', aiRoutes);
router.use('/logistics', logisticsRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

if (process.env.NODE_ENV !== 'production') {
  router.use('/dev/email-preview', require('./devRoutes'));
}

module.exports = router;
