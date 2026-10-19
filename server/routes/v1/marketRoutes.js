const express = require('express');
const router = express.Router();
const marketController = require('../../controllers/marketController');
const authenticate = require('../../middleware/authenticate');

// Market prices and trends (public or authenticated)
router.get('/prices', marketController.getCurrentPrices);
router.get('/prices/:crop/history', marketController.getPriceHistory);
router.get('/recommendation', authenticate, marketController.getSmartRecommendation);

module.exports = router;
