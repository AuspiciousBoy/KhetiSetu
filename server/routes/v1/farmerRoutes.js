const express = require('express');
const router = express.Router();
const farmerController = require('../../controllers/farmerController');
const userController = require('../../controllers/userController');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { createBatchSchema, createListingSchema } = require('../../validators/farmerValidators');
const { upload, verifyAndSaveFile } = require('../../security/fileValidator');
const { fileUploadLimiter, aiLimiter } = require('../../config/rateLimits');

// All farmer routes require authentication and FARMER or ADMIN role
router.use(authenticate, authorize('FARMER', 'ADMIN'));

// Profile
router.get('/profile', farmerController.getProfile);
router.put('/profile', farmerController.updateProfile);

// Payment Settings (UPI & QR)
router.get('/payment', userController.getFarmerPayment);
router.put('/payment', userController.updateFarmerPayment);
router.post(
  '/payment/qr',
  fileUploadLimiter,
  upload.single('qrImage'),
  verifyAndSaveFile,
  userController.uploadFarmerQr
);
router.delete('/payment/qr', userController.deleteFarmerQr);
router.put('/location', userController.updateFarmerLocation);

// Batches
router.post('/batches', validate(createBatchSchema), farmerController.createBatch);
router.get('/batches', farmerController.getBatches);
router.get('/batches/:id', farmerController.getBatchById);

// AI Quality Assessment upload for a batch
router.post(
  '/batches/:id/quality-assess',
  aiLimiter,
  fileUploadLimiter,
  upload.single('produceImage'),
  verifyAndSaveFile,
  farmerController.assessQuality
);

// Listings
router.post(
  ['/listings/upload-image', '/listings/upload'],
  fileUploadLimiter,
  upload.single('productImage'),
  verifyAndSaveFile,
  farmerController.uploadListingImage
);
router.post('/listings', validate(createListingSchema), farmerController.createListing);

// Analytics
router.get('/analytics', farmerController.getAnalytics);

module.exports = router;
