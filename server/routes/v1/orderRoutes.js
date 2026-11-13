const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/orderController');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { createOrderSchema, previewQuoteSchema } = require('../../validators/orderValidators');
const { orderLimiter, fileUploadLimiter } = require('../../config/rateLimits');
const { upload, verifyAndSaveFile } = require('../../security/fileValidator');

router.use(authenticate);

// Preview order quote with live distance, delivery fee, GST & 40% advance
router.post(
  '/preview-quote',
  authorize('CONSUMER', 'BUSINESS', 'ADMIN', 'FARMER'),
  validate(previewQuoteSchema),
  orderController.previewQuote
);

// Upload payment proof screenshot (JPG, PNG, WEBP)
router.post(
  '/upload-proof',
  authorize('CONSUMER', 'BUSINESS', 'ADMIN', 'FARMER'),
  fileUploadLimiter,
  upload.single('paymentProof'),
  verifyAndSaveFile,
  orderController.uploadPaymentProof
);

// Create order (Consumer or Business)
router.post(
  '/',
  authorize('CONSUMER', 'BUSINESS', 'ADMIN', 'FARMER'),
  orderLimiter,
  validate(createOrderSchema),
  orderController.createOrder
);

// Get my orders as buyer
router.get('/my-orders', authorize('CONSUMER', 'BUSINESS', 'ADMIN'), orderController.getBuyerOrders);

// Get my orders as farmer
router.get('/farmer-orders', authorize('FARMER', 'ADMIN'), orderController.getFarmerOrders);

// Get single order invoice
router.get('/:id/invoice', orderController.getOrderInvoice);

// Get single order with Object-Level Authorization
router.get('/:id', orderController.getOrderById);

// Update order status (Farmer, Admin, Logistics Operator)
router.patch('/:id/status', authorize('FARMER', 'ADMIN', 'LOGISTICS_OPERATOR'), orderController.updateOrderStatus);
router.put('/:id/status', authorize('FARMER', 'ADMIN', 'LOGISTICS_OPERATOR'), orderController.updateOrderStatus);

module.exports = router;
