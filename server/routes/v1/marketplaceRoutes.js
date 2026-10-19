const express = require('express');
const router = express.Router();
const marketplaceController = require('../../controllers/marketplaceController');

// Public Marketplace browsing
router.get('/products', marketplaceController.listProducts);
router.get('/products/:id', marketplaceController.getProductById);

module.exports = router;
