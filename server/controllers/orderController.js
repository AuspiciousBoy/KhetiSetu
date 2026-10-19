const orderService = require('../services/orderService');
const { success, paginated, error } = require('../utils/response');

const createOrder = async (req, res, next) => {
  try {
    const result = await orderService.createOrder({
      buyerId: req.user.id,
      buyerRole: req.user.role,
      items: req.body.items,
      deliveryAddress: req.body.deliveryAddress,
      paymentMethod: req.body.paymentMethod,
      idempotencyKey: req.headers['idempotency-key'] || req.body.idempotencyKey,
      req,
    });

    return success(
      res,
      result.order,
      result.isExisting ? 'Returning previously created order' : 'Order placed successfully',
      result.isExisting ? 200 : 201
    );
  } catch (err) {
    next(err);
  }
};

const getBuyerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await orderService.getOrdersForBuyer(req.user.id, {
      page: Number(page),
      limit: Number(limit),
    });
    return paginated(res, result.orders, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
};

const getFarmerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await orderService.getOrdersForFarmer(req.user.id, {
      page: Number(page),
      limit: Number(limit),
      status,
    });
    return paginated(res, result.orders, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id, req.user.role);
    return success(res, order);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  getOrderById,
};
