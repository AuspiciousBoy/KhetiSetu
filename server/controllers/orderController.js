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

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus({
      orderId: req.params.id,
      status: req.body.status,
      note: req.body.note,
      location: req.body.location,
      actorId: req.user.id,
      actorRole: req.user.role,
      req,
    });
    return success(res, order, `Order status transitioned to ${order.status} successfully`);
  } catch (err) {
    next(err);
  }
};

const previewQuote = async (req, res, next) => {
  try {
    const quote = await orderService.previewOrderQuote({
      items: req.body.items,
      deliveryAddress: req.body.deliveryAddress,
      coordinates: req.body.coordinates,
      buyerRole: req.user.role,
    });
    return success(res, quote, 'Order quote calculated successfully');
  } catch (err) {
    next(err);
  }
};

const uploadPaymentProof = async (req, res, next) => {
  try {
    if (!req.savedFile?.filename) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid payment screenshot (JPG, PNG, or WEBP under 5MB) is required.' },
      });
    }
    const paymentProofUrl = `/uploads/${req.savedFile.filename}`;
    return success(res, { paymentProofUrl }, 'Payment proof uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getOrderInvoice = async (req, res, next) => {
  try {
    const invoice = await orderService.getOrderInvoice(req.params.id, req.user.id, req.user.role);
    return success(res, invoice, 'Order invoice retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelBuyerOrder({
      orderId: req.params.id,
      buyerId: req.user.id,
      reason,
      req,
    });
    return success(res, order, 'Order cancelled and refund requested successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getBuyerOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  previewQuote,
  uploadPaymentProof,
  getOrderInvoice,
};
