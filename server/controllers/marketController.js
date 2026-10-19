const marketService = require('../services/marketService');
const { success } = require('../utils/response');

const getCurrentPrices = async (req, res, next) => {
  try {
    const prices = await marketService.getCurrentPrices(req.query);
    return success(res, prices);
  } catch (err) {
    next(err);
  }
};

const getPriceHistory = async (req, res, next) => {
  try {
    const { crop } = req.params;
    const { days = 30 } = req.query;
    const data = await marketService.getCropPriceHistory(crop, Number(days));
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getSmartRecommendation = async (req, res, next) => {
  try {
    const { crop = 'Tomato', quantity = 500 } = req.query;
    const data = await marketService.getSmartMarketRecommendations({
      cropName: crop,
      quantityKg: Number(quantity),
    });
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCurrentPrices,
  getPriceHistory,
  getSmartRecommendation,
};
