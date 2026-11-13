const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { upload, verifyAndSaveFile } = require('../../security/fileValidator');
const { fileUploadLimiter } = require('../../config/rateLimits');

// All user routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Addresses (Consumer & Business)
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);
router.patch('/addresses/:id/default', userController.setDefaultAddress);

// Farmer Payment & Location (Only Farmer & Admin)
router.get('/farmer/payment', authorize('FARMER', 'ADMIN'), userController.getFarmerPayment);
router.put('/farmer/payment', authorize('FARMER', 'ADMIN'), userController.updateFarmerPayment);
router.post(
  '/farmer/payment/qr',
  authorize('FARMER', 'ADMIN'),
  fileUploadLimiter,
  upload.single('qrImage'),
  verifyAndSaveFile,
  userController.uploadFarmerQr
);
router.delete('/farmer/payment/qr', authorize('FARMER', 'ADMIN'), userController.deleteFarmerQr);
router.put('/farmer/location', authorize('FARMER', 'ADMIN'), userController.updateFarmerLocation);

module.exports = router;
