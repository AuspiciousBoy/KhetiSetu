const marketplaceService = require('../services/marketplaceService');
const { paginated, success } = require('../utils/response');

const listProducts = async (req, res, next) => {
  try {
    const result = await marketplaceService.listProducts(req.query);
    return paginated(res, result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await marketplaceService.getProductById(req.params.id);
    return success(res, product);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProducts,
  getProductById,
};
