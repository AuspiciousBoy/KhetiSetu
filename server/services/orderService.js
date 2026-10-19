const Order = require('../models/Order');
const Product = require('../models/Product');
const ProduceBatch = require('../models/ProduceBatch');
const Delivery = require('../models/Delivery');
const Cart = require('../models/Cart');
const { logAuditEvent } = require('../middleware/auditLogger');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { ApiError } = require('../utils/response');

// Standard delivery fee calculation in INR
const calculateDeliveryFee = (distanceKm = 20, isB2B = false) => {
  if (isB2B) {
    return Math.max(500, Math.round(distanceKm * 25)); // Commercial freight
  }
  return Math.max(40, Math.round(distanceKm * 3)); // Retail delivery
};

/**
 * Server-Authoritative Order Creation
 * Validates stock, calculates prices, reserves inventory atomically, and handles idempotency.
 */
const createOrder = async ({
  buyerId,
  buyerRole,
  items,
  deliveryAddress,
  paymentMethod = 'UPI',
  idempotencyKey,
  req,
}) => {
  if (!items || !items.length) {
    throw new Error('An order must contain at least one item.');
  }

  // Idempotency check: if key already exists, return previously processed order
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey, buyerId });
    if (existingOrder) {
      return { order: existingOrder, isExisting: true };
    }
  }

  // Group items by farmer (an order connects to a single fulfillment origin)
  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== items.length) {
    throw new Error('One or more selected products are invalid or no longer available.');
  }

  const primaryFarmerId = products[0].farmerId;
  const isB2B = buyerRole === 'BUSINESS';

  // Server-Authoritative Calculation
  let serverSubtotal = 0;
  const verifiedOrderItems = [];

  for (const requestedItem of items) {
    const product = products.find((p) => p._id.toString() === requestedItem.productId.toString());
    const qty = parseInt(requestedItem.quantity, 10);

    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Invalid quantity (${requestedItem.quantity}) specified.`);
    }

    if (qty < product.minOrderQuantity) {
      throw new Error(`Quantity for "${product.title}" must be at least ${product.minOrderQuantity} ${product.unit}.`);
    }

    if (qty > product.maxOrderQuantity) {
      throw new Error(`Quantity for "${product.title}" exceeds maximum order limit of ${product.maxOrderQuantity} ${product.unit}.`);
    }

    // ATOMIC INVENTORY RESERVATION:
    // Decrement stock only if availableQuantity >= requested qty.
    // Prevents race conditions and overselling without locking the whole table.
    const updatedProduct = await Product.findOneAndUpdate(
      {
        _id: product._id,
        availableQuantity: { $gte: qty },
        status: 'ACTIVE',
      },
      {
        $inc: { availableQuantity: -qty },
      },
      { returnDocument: 'after' }
    );

    if (!updatedProduct) {
      throw new Error(`Insufficient inventory for "${product.title}". Stock may have just been claimed by another buyer.`);
    }

    // If stock hit 0, mark as SOLD_OUT
    if (updatedProduct.availableQuantity === 0) {
      updatedProduct.status = 'SOLD_OUT';
      await updatedProduct.save();
    }

    // Also decrement batch available quantity
    await ProduceBatch.findByIdAndUpdate(product.batchId, {
      $inc: { availableQuantity: -qty },
    });

    const lineTotal = product.pricePerUnit * qty;
    serverSubtotal += lineTotal;

    verifiedOrderItems.push({
      productId: product._id,
      batchId: product.batchId,
      title: product.title,
      cropName: product.title,
      quantity: qty,
      unit: product.unit,
      unitPrice: product.pricePerUnit,
      lineTotal,
    });
  }

  const deliveryFee = calculateDeliveryFee(15, isB2B);
  const tax = Math.round(serverSubtotal * 0.05); // 5% agricultural processing / GST if applicable
  const grandTotal = serverSubtotal + deliveryFee + tax;

  const orderId = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const order = await Order.create({
    orderId,
    buyerId,
    buyerRole,
    farmerId: primaryFarmerId,
    items: verifiedOrderItems,
    subtotal: serverSubtotal,
    deliveryFee,
    tax,
    total: grandTotal,
    status: 'PLACED',
    paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PAID', // In mock checkout
    paymentMethod,
    deliveryAddress,
    idempotencyKey,
  });

  // Automatically create delivery record
  const deliveryId = `DEL-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const delivery = await Delivery.create({
    deliveryId,
    orderId: order._id,
    pickupAddress: {
      line1: 'Farm Gate Depot',
      district: 'Pune',
      state: 'Maharashtra',
    },
    dropAddress: deliveryAddress,
    status: 'PLACED',
    distanceKm: 15,
    estimatedTransportCost: deliveryFee,
    estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    trackingEvents: [
      {
        status: 'PLACED',
        location: 'KhetiSetu Central System',
        note: 'Order successfully registered and assigned to farm dispatch queue.',
        timestamp: new Date(),
      },
    ],
  });

  order.deliveryId = delivery._id;
  await order.save();

  // Clear consumer cart upon successful order
  await Cart.findOneAndUpdate({ consumerId: buyerId }, { $set: { items: [] } });

  await logAuditEvent({
    req,
    actorId: buyerId,
    actorRole: buyerRole,
    action: 'ORDER_CREATED',
    resource: 'Order',
    resourceId: order._id,
    result: 'SUCCESS',
    metadata: { orderId, total: grandTotal, itemsCount: items.length },
  });

  return { order, delivery, isExisting: false };
};

/**
 * Get orders for buyer with Object-Level Authorization
 */
const getOrdersForBuyer = async (buyerId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ buyerId })
      .populate('farmerId', 'fullName phone email')
      .populate('deliveryId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ buyerId }),
  ]);
  return { orders, total, page, limit };
};

/**
 * Get orders for farmer with Object-Level Authorization
 */
const getOrdersForFarmer = async (farmerId, { page = 1, limit = 10, status }) => {
  const query = { farmerId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('buyerId', 'fullName email phone')
      .populate('deliveryId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, total, page, limit };
};

/**
 * Get single order by ID with strict ownership validation
 */
const getOrderById = async (orderIdentifier, requestingUserId, userRole) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderIdentifier);
  const query = isObjectId ? { _id: orderIdentifier } : { orderId: orderIdentifier };

  const order = await Order.findOne(query)
    .populate('farmerId', 'fullName email phone')
    .populate('buyerId', 'fullName email phone')
    .populate('deliveryId');

  if (!order) {
    throw new ApiError(404, 'Order not found.', 'NOT_FOUND');
  }

  // Object-Level Authorization (BOLA check)
  const isOwner =
    order.buyerId?._id?.toString() === requestingUserId.toString() ||
    order.farmerId?._id?.toString() === requestingUserId.toString() ||
    userRole === 'ADMIN';

  if (!isOwner) {
    throw new ApiError(403, 'You do not have authorization to view this order.', 'FORBIDDEN');
  }

  return order;
};

module.exports = {
  createOrder,
  getOrdersForBuyer,
  getOrdersForFarmer,
  getOrderById,
  calculateDeliveryFee,
};
