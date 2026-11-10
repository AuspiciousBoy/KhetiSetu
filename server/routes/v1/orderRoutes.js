const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/orderController');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { createOrderSchema } = require('../../validators/orderValidators');
const { orderLimiter } = require('../../config/rateLimits');

router.use(authenticate);

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

// Get single order with Object-Level Authorization
router.get('/:id', orderController.getOrderById);

module.exports = router;
