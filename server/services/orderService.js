const Order = require('../models/Order');
const Product = require('../models/Product');
const ProduceBatch = require('../models/ProduceBatch');
const Delivery = require('../models/Delivery');
const Cart = require('../models/Cart');
const User = require('../models/User');
const BusinessProfile = require('../models/BusinessProfile');
const FarmerProfile = require('../models/FarmerProfile');
const { logAuditEvent } = require('../middleware/auditLogger');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { ApiError } = require('../utils/response');
const { queueEmail } = require('../integrations/emailService');
const emailConfig = require('../config/emailConfig');

// Haversine formula to compute great-circle distance between two geographic coordinates
const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    return 15; // default fallback distance in km
  }
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.max(1, Math.round(distance * 10) / 10); // Minimum 1 km, 1 decimal place
};

// Standard distance-based delivery fee calculation in INR
const calculateDeliveryFee = (distanceKm = 15, isB2B = false) => {
  const km = Math.max(1, Number(distanceKm) || 15);
  if (isB2B) {
    // Commercial freight: base ₹500 covers initial 20km + ₹25/km beyond 20km
    return Math.max(500, Math.round(500 + Math.max(0, km - 20) * 25));
  }
  // Retail delivery: base ₹40 covers initial 5km + ₹6/km beyond 5km
  return Math.max(40, Math.round(40 + Math.max(0, km - 5) * 6));
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
  paymentMethod = 'DIRECT_ORDER',
  paymentProofUrl,
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

  // Look up produce batches to snapshot explicit human-readable batch codes
  const batchObjectIds = products.map((p) => p.batchId).filter(Boolean);
  const produceBatches = await ProduceBatch.find({ _id: { $in: batchObjectIds } });
  const batchMap = new Map(produceBatches.map((b) => [b._id.toString(), b]));

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

    const batch = product.batchId ? batchMap.get(product.batchId.toString()) : null;
    const resolvedBatchCode = batch?.batchId || (product.batchId ? `BATCH-${product.batchId.toString().slice(-6).toUpperCase()}` : 'HARVEST-LOT');

    verifiedOrderItems.push({
      productId: product._id,
      batchId: product.batchId,
      batchCode: resolvedBatchCode,
      farmerId: product.farmerId,
      title: product.title,
      cropName: product.title,
      quantity: qty,
      unit: product.unit,
      unitPrice: product.pricePerUnit,
      lineTotal,
    });
  }

  // Resolve unique farmers involved in this order to snapshot their payment information
  const farmerIds = [...new Set(products.map((p) => p.farmerId.toString()))];
  const [farmers, farmerProfiles, buyerUser] = await Promise.all([
    User.find({ _id: { $in: farmerIds } }).select('fullName phone email'),
    FarmerProfile.find({ userId: { $in: farmerIds } }),
    User.findById(buyerId).select('fullName phone email role'),
  ]);

  const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f]));
  const profileMap = new Map(farmerProfiles.map((fp) => [fp.userId.toString(), fp]));

  const primaryFarmerProfile = profileMap.get(primaryFarmerId.toString());
  const primaryFarmerUser = farmerMap.get(primaryFarmerId.toString());

  const fLat = primaryFarmerProfile?.location?.coordinates?.latitude;
  const fLon = primaryFarmerProfile?.location?.coordinates?.longitude;
  const bLat = deliveryAddress?.coordinates?.latitude;
  const bLon = deliveryAddress?.coordinates?.longitude;

  const distanceKm = calculateHaversineDistanceKm(fLat, fLon, bLat, bLon);
  const deliveryFee = calculateDeliveryFee(distanceKm, isB2B);
  const tax = Math.round(serverSubtotal * 0.05); // 5% agricultural processing / GST
  const grandTotal = serverSubtotal + deliveryFee + tax;
  const advanceAmount = Math.round(grandTotal * 0.40);
  const pendingAmount = grandTotal - advanceAmount;

  const farmerPaymentInfo = farmerIds.map((fId) => {
    const fProfile = profileMap.get(fId);
    const fUser = farmerMap.get(fId);
    const farmerItemsTotal = verifiedOrderItems
      .filter((item) => item.farmerId?.toString() === fId)
      .reduce((sum, item) => sum + item.lineTotal, 0);

    const fAdv = Math.round(farmerItemsTotal * 0.40);

    return {
      farmerId: fId,
      farmerName: fUser?.fullName || 'Grower',
      upiId: fProfile?.paymentSettings?.upiId || '',
      upiQrCodeUrl: fProfile?.paymentSettings?.upiQrCodeUrl || '',
      amount: farmerItemsTotal,
      advanceAmount: fAdv,
      pendingAmount: farmerItemsTotal - fAdv,
    };
  });

  const orderId = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const buyerDetails = {
    buyerId,
    fullName: buyerUser?.fullName || deliveryAddress.fullName,
    phone: buyerUser?.phone || deliveryAddress.phone,
    email: buyerUser?.email || '',
    role: buyerRole,
  };

  const sellerDetails = {
    farmerId: primaryFarmerId,
    fullName: primaryFarmerUser?.fullName || 'Grower',
    farmName: primaryFarmerProfile?.farmName || `${primaryFarmerUser?.fullName || 'Grower'}'s Farm`,
    phone: primaryFarmerUser?.phone || '',
    upiId: primaryFarmerProfile?.paymentSettings?.upiId || '',
    location: primaryFarmerProfile?.location || {},
  };

  const order = await Order.create({
    orderId,
    invoiceNumber,
    buyerId,
    buyerRole,
    farmerId: primaryFarmerId,
    items: verifiedOrderItems,
    farmerPaymentInfo,
    sellerDetails,
    buyerDetails,
    farmerCoordinates: {
      latitude: fLat || null,
      longitude: fLon || null,
    },
    distanceKm,
    subtotal: serverSubtotal,
    deliveryFee,
    tax,
    total: grandTotal,
    advanceAmount,
    pendingAmount,
    paymentProofUrl: paymentProofUrl || '',
    paymentProofUploadedAt: paymentProofUrl ? new Date() : null,
    status: 'PLACED',
    paymentStatus: paymentProofUrl ? 'ADVANCE_PAID' : 'CONFIRMED',
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
      district: primaryFarmerProfile?.location?.district || 'Pune',
      state: primaryFarmerProfile?.location?.state || 'Maharashtra',
    },
    dropAddress: deliveryAddress,
    status: 'PLACED',
    distanceKm,
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

  // Asynchronously dispatch buyer order receipt & farmer dispatch alert
  setImmediate(async () => {
    try {
      const [buyer, farmer, firstBatch] = await Promise.all([
        User.findById(buyerId).select('email fullName emailPreferences'),
        User.findById(primaryFarmerId).select('email fullName emailPreferences'),
        verifiedOrderItems[0]?.batchId ? ProduceBatch.findById(verifiedOrderItems[0].batchId).select('batchId originLocation') : null,
      ]);

      if (buyer && buyer.email) {
        queueEmail({
          to: buyer.email,
          template: 'order-placed-buyer',
          subject: `Order Confirmed ✓ — ${orderId} — KhetiSetu`,
          context: {
            buyerName: buyer.fullName || 'Customer',
            orderId,
            orderDate: order.createdAt,
            items: verifiedOrderItems,
            subtotal: serverSubtotal,
            deliveryFee,
            tax,
            grandTotal,
            paymentMethod,
            deliveryAddress,
            estimatedDelivery: delivery.estimatedDeliveryDate,
            trackingUrl: `${emailConfig.appUrl}/track/${orderId}`,
            batchTraceability: firstBatch
              ? {
                  batchId: firstBatch.batchId,
                  farmName: farmer?.fullName ? `${farmer.fullName}'s Farm` : 'Verified Farm',
                }
              : null,
          },
          user: buyer,
        });
      }

      if (farmer && farmer.email) {
        queueEmail({
          to: farmer.email,
          template: 'order-placed-farmer',
          subject: `🛒 नया ऑर्डर मिला! — ${orderId} — KhetiSetu`,
          context: {
            farmerName: farmer.fullName || 'Farmer Partner',
            orderId,
            items: verifiedOrderItems,
            orderTotal: grandTotal,
            buyerDistrict: deliveryAddress?.city || deliveryAddress?.district || 'Buyer Location',
            dispatchBy: delivery.estimatedDeliveryDate,
            orderUrl: `${emailConfig.appUrl}/farmer/orders`,
          },
          user: farmer,
        });
      }
    } catch (emailErr) {
      // Async failure is non-fatal
    }
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
 * Get orders for farmer with robust farmer-product-batch resolution
 */
const getOrdersForFarmer = async (farmerId, { page = 1, limit = 10, status }) => {
  // 1. Resolve all product and batch IDs belonging to this farmer
  const [farmerProducts, farmerBatches] = await Promise.all([
    Product.find({ farmerId }).select('_id'),
    ProduceBatch.find({ farmerId }).select('_id'),
  ]);

  const fProdIds = farmerProducts.map((p) => p._id);
  const fBatchIds = farmerBatches.map((b) => b._id);

  // 2. Query orders: order.farmerId matches OR any item's productId/batchId matches
  const farmerMatchConditions = [{ farmerId: new mongoose.Types.ObjectId(farmerId) }];
  if (fProdIds.length > 0) {
    farmerMatchConditions.push({ 'items.productId': { $in: fProdIds } });
  }
  if (fBatchIds.length > 0) {
    farmerMatchConditions.push({ 'items.batchId': { $in: fBatchIds } });
  }

  const query = { $or: farmerMatchConditions };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('buyerId', 'fullName email phone role')
      .populate('deliveryId')
      .populate('items.batchId', 'batchId cropName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query),
  ]);

  // 3. Populate BusinessProfile for B2B buyers
  const businessBuyerIds = orders
    .filter((o) => (o.buyerRole === 'BUSINESS' || o.buyerId?.role === 'BUSINESS') && o.buyerId?._id)
    .map((o) => o.buyerId._id);

  if (businessBuyerIds.length > 0) {
    const businessProfiles = await BusinessProfile.find({ userId: { $in: businessBuyerIds } }).lean();
    const profileMap = new Map(businessProfiles.map((bp) => [bp.userId.toString(), bp]));

    for (const order of orders) {
      if (order.buyerId?._id) {
        const bp = profileMap.get(order.buyerId._id.toString());
        if (bp) {
          order.businessProfile = {
            businessName: bp.businessName,
            businessType: bp.businessType,
            gstNumber: bp.gstNumber,
          };
        }
      }
    }
  }

  // 4. Ensure each farmer only sees their relevant order items
  const fProdIdStrs = new Set(fProdIds.map((id) => id.toString()));
  const fBatchIdStrs = new Set(fBatchIds.map((id) => id.toString()));
  const farmerIdStr = farmerId.toString();

  for (const order of orders) {
    const isPrimaryFarmer = order.farmerId?.toString() === farmerIdStr;

    // Filter items to only farmer's items if there are multi-farmer items
    const relevantItems = order.items.filter((item) => {
      if (isPrimaryFarmer) return true;
      const matchesProd = item.productId && fProdIdStrs.has(item.productId.toString());
      const matchesBatch = item.batchId && fBatchIdStrs.has(item.batchId.toString());
      return matchesProd || matchesBatch;
    });

    // Ensure human-readable batch code is populated on each item
    for (const item of relevantItems) {
      if (!item.batchCode) {
        if (typeof item.batchId === 'object' && item.batchId?.batchId) {
          item.batchCode = item.batchId.batchId;
        } else if (item.batchId) {
          item.batchCode = `BATCH-${item.batchId.toString().slice(-6).toUpperCase()}`;
        } else {
          item.batchCode = 'HARVEST-LOT';
        }
      }
    }

    order.items = relevantItems;
    order.farmerSubtotal = relevantItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);

    // Isolate farmer payment info so this farmer only sees their own payment information
    if (order.farmerPaymentInfo) {
      order.farmerPaymentInfo = order.farmerPaymentInfo.filter(
        (pi) => pi.farmerId?.toString() === farmerIdStr
      );
    }
  }

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
    .populate('buyerId', 'fullName email phone role')
    .populate('deliveryId');

  if (!order) {
    throw new ApiError(404, 'Order not found.', 'NOT_FOUND');
  }

  // Check direct ownership
  let isOwner =
    order.buyerId?._id?.toString() === requestingUserId.toString() ||
    order.farmerId?._id?.toString() === requestingUserId.toString() ||
    userRole === 'ADMIN';

  // Check product/batch relationship for farmers
  if (!isOwner && userRole === 'FARMER') {
    const [farmerProducts, farmerBatches] = await Promise.all([
      Product.find({ farmerId: requestingUserId }).select('_id'),
      ProduceBatch.find({ farmerId: requestingUserId }).select('_id'),
    ]);
    const fProdIds = new Set(farmerProducts.map((p) => p._id.toString()));
    const fBatchIds = new Set(farmerBatches.map((b) => b._id.toString()));

    const ownsAnyItem = order.items.some(
      (item) =>
        (item.productId && fProdIds.has(item.productId.toString())) ||
        (item.batchId && fBatchIds.has(item.batchId.toString()))
    );

    if (ownsAnyItem) {
      isOwner = true;
    }
  }

  if (!isOwner) {
    throw new ApiError(403, 'You do not have authorization to view this order.', 'FORBIDDEN');
  }

  // If business buyer, populate business profile
  if (order.buyerRole === 'BUSINESS' || order.buyerId?.role === 'BUSINESS') {
    const bp = await BusinessProfile.findOne({ userId: order.buyerId?._id || order.buyerId }).lean();
    if (bp) {
      order._doc.businessProfile = {
        businessName: bp.businessName,
        businessType: bp.businessType,
        gstNumber: bp.gstNumber,
      };
    }
  }

  // If requesting user is a farmer, only reveal payment info corresponding to them
  if (userRole === 'FARMER' && order.farmerPaymentInfo) {
    order._doc.farmerPaymentInfo = order.farmerPaymentInfo.filter(
      (pi) => pi.farmerId?.toString() === requestingUserId.toString()
    );
  }

  return order;
};

/**
 * Update order and delivery status by fulfilling farmer or admin
 */
const updateOrderStatus = async ({ orderId, status, note, location, actorId, actorRole, req }) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
  const query = isObjectId ? { _id: orderId } : { orderId };

  const order = await Order.findOne(query)
    .populate('buyerId', 'email fullName role')
    .populate('deliveryId');

  if (!order) {
    throw new ApiError(404, 'Order not found.', 'NOT_FOUND');
  }

  // Resolve farmer ownership
  const [farmerProducts, farmerBatches] = await Promise.all([
    Product.find({ farmerId: actorId }).select('_id'),
    ProduceBatch.find({ farmerId: actorId }).select('_id'),
  ]);
  const fProdIds = farmerProducts.map((p) => p._id.toString());
  const fBatchIds = farmerBatches.map((b) => b._id.toString());

  const isFulfillingFarmer =
    order.farmerId?.toString() === actorId.toString() ||
    order.sellerDetails?.farmerId?.toString() === actorId.toString() ||
    order.farmerPaymentInfo?.some((f) => f.farmerId?.toString() === actorId.toString()) ||
    order.items.some(
      (item) =>
        (item.productId && fProdIds.includes(item.productId.toString())) ||
        (item.batchId && fBatchIds.includes(item.batchId.toString()))
    );

  const isAdminOrLogistics = ['ADMIN', 'LOGISTICS_OPERATOR'].includes(actorRole);

  if (!isFulfillingFarmer && !isAdminOrLogistics) {
    throw new ApiError(403, 'You do not have authorization to update this order.', 'FORBIDDEN');
  }

  const validStatuses = [
    'PLACED',
    'CONFIRMED',
    'PACKED',
    'ASSIGNED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid order status: ${status}`, 'INVALID_STATUS');
  }

  order.status = status;

  if (status === 'CANCELLED') {
    order.cancelledReason = note || 'Declined / cancelled by farmer';
    order.cancelledBy = actorRole === 'ADMIN' ? 'ADMIN' : 'FARMER';
    order.cancelledAt = new Date();
    if (actorRole === 'FARMER') {
      order.paymentStatus = 'PAYMENT_REJECTED';
    }
    // Restore inventory back to product and batch
    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { availableQuantity: item.quantity },
          $set: { status: 'ACTIVE' },
        });
      }
      if (item.batchId) {
        await ProduceBatch.findByIdAndUpdate(item.batchId, {
          $inc: { availableQuantity: item.quantity },
          $set: { listingStatus: 'LISTED_FULL' },
        });
      }
    }
  }

  await order.save();

  // Sync state to Delivery
  if (order.deliveryId) {
    let delivery = await Delivery.findById(order.deliveryId);
    if (!delivery && mongoose.Types.ObjectId.isValid(order.deliveryId)) {
      delivery = await Delivery.findOne({ orderId: order._id });
    }
    if (delivery) {
      delivery.status = status;
      delivery.trackingEvents.push({
        status,
        location: location || delivery.dropAddress?.city || 'Farm Gate Dispatch Point',
        note: note || `Order updated to ${status} by ${actorRole === 'ADMIN' ? 'Platform Admin' : 'Farmer'}`,
        updatedBy: actorId,
        timestamp: new Date(),
      });
      if (status === 'DELIVERED') {
        delivery.actualDeliveryDate = new Date();
      }
      await delivery.save();
    }
  }

  await logAuditEvent({
    req,
    actorId,
    actorRole,
    action: 'ORDER_STATUS_UPDATED',
    resource: 'Order',
    resourceId: order._id,
    result: 'SUCCESS',
    metadata: { orderId: order.orderId, newStatus: status, note },
  });

  // Asynchronously dispatch notifications to buyer
  setImmediate(async () => {
    try {
      if (order.buyerId?.email && ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
        const templateMap = {
          PACKED: 'order-packed',
          OUT_FOR_DELIVERY: 'order-dispatched',
          DELIVERED: 'order-delivered-buyer',
        };
        const template = templateMap[status];
        if (template) {
          queueEmail({
            to: order.buyerId.email,
            template,
            subject: `Order Update [${status}] — ${order.orderId} — KhetiSetu`,
            context: {
              buyerName: order.buyerId.fullName || 'Customer',
              orderId: order.orderId,
              status,
              items: order.items,
              total: order.total,
              trackingUrl: `${emailConfig.appUrl}/consumer/orders/${order._id}`,
            },
            user: order.buyerId,
          });
        }
      }
    } catch (e) {}
  });

  return order;
};

/**
 * Preview order quote with live distance, delivery fee, GST, and 40% advance calculation
 */
const previewOrderQuote = async ({ items, deliveryAddress, coordinates, buyerRole = 'CONSUMER' }) => {
  if (!items || !items.length) {
    throw new ApiError(400, 'Quote requires at least one order item.', 'INVALID_ITEMS');
  }

  const productIds = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== items.length) {
    throw new ApiError(404, 'One or more selected products are invalid or unavailable.', 'PRODUCT_NOT_FOUND');
  }

  const isB2B = buyerRole === 'BUSINESS';
  let serverSubtotal = 0;
  const resolvedItems = [];

  for (const requestedItem of items) {
    const product = products.find((p) => p._id.toString() === requestedItem.productId.toString());
    const qty = parseInt(requestedItem.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new ApiError(400, `Invalid quantity (${requestedItem.quantity}) specified.`, 'INVALID_QTY');
    }
    const lineTotal = product.pricePerUnit * qty;
    serverSubtotal += lineTotal;
    resolvedItems.push({
      productId: product._id,
      title: product.title,
      quantity: qty,
      unit: product.unit,
      unitPrice: product.pricePerUnit,
      lineTotal,
      farmerId: product.farmerId,
    });
  }

  const farmerIds = [...new Set(products.map((p) => p.farmerId.toString()))];
  const [farmers, farmerProfiles] = await Promise.all([
    User.find({ _id: { $in: farmerIds } }).select('fullName phone email'),
    FarmerProfile.find({ userId: { $in: farmerIds } }),
  ]);

  const farmerMap = new Map(farmers.map((f) => [f._id.toString(), f]));
  const profileMap = new Map(farmerProfiles.map((fp) => [fp.userId.toString(), fp]));

  const primaryFarmerId = products[0].farmerId;
  const primaryFarmerProfile = profileMap.get(primaryFarmerId.toString());

  const buyerCoords = coordinates || deliveryAddress?.coordinates || {};
  const fLat = primaryFarmerProfile?.location?.coordinates?.latitude;
  const fLon = primaryFarmerProfile?.location?.coordinates?.longitude;
  const bLat = buyerCoords.latitude;
  const bLon = buyerCoords.longitude;

  const distanceKm = calculateHaversineDistanceKm(fLat, fLon, bLat, bLon);
  const deliveryFee = calculateDeliveryFee(distanceKm, isB2B);
  const tax = Math.round(serverSubtotal * 0.05); // 5% GST
  const grandTotal = serverSubtotal + deliveryFee + tax;
  const advanceAmount = Math.round(grandTotal * 0.40);
  const pendingAmount = grandTotal - advanceAmount;

  const farmerPaymentInfo = farmerIds.map((fId) => {
    const fProfile = profileMap.get(fId);
    const fUser = farmerMap.get(fId);
    const farmerItemsTotal = resolvedItems
      .filter((item) => item.farmerId?.toString() === fId)
      .reduce((sum, item) => sum + item.lineTotal, 0);

    const fAdv = Math.round(farmerItemsTotal * 0.40);

    return {
      farmerId: fId,
      farmerName: fUser?.fullName || 'Grower',
      farmName: fProfile?.farmName || `${fUser?.fullName || 'Grower'}'s Farm`,
      upiId: fProfile?.paymentSettings?.upiId || '',
      upiQrCodeUrl: fProfile?.paymentSettings?.upiQrCodeUrl || '',
      isConfigured: Boolean(fProfile?.paymentSettings?.isConfigured),
      amount: farmerItemsTotal,
      advanceAmount: fAdv,
      pendingAmount: farmerItemsTotal - fAdv,
    };
  });

  return {
    subtotal: serverSubtotal,
    distanceKm,
    deliveryFee,
    tax,
    total: grandTotal,
    advanceAmount,
    pendingAmount,
    items: resolvedItems,
    farmerPaymentInfo,
    primaryFarmer: farmerPaymentInfo[0] || null,
  };
};

/**
 * Fetch authoritative order invoice
 */
const getOrderInvoice = async (orderIdentifier, userId, userRole) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderIdentifier);
  const query = isObjectId
    ? { $or: [{ _id: orderIdentifier }, { orderId: orderIdentifier }, { invoiceNumber: orderIdentifier }] }
    : { $or: [{ orderId: orderIdentifier }, { invoiceNumber: orderIdentifier }] };

  const order = await Order.findOne(query)
    .populate('buyerId', 'fullName email phone role')
    .populate('farmerId', 'fullName phone email')
    .populate('deliveryId');

  if (!order) {
    throw new ApiError(404, 'Order not found.', 'NOT_FOUND');
  }

  // Authorization check
  const isBuyer = order.buyerId?._id?.toString() === userId.toString();
  const isFarmer =
    order.farmerId?._id?.toString() === userId.toString() ||
    order.sellerDetails?.farmerId?.toString() === userId.toString() ||
    order.farmerPaymentInfo?.some((f) => f.farmerId?.toString() === userId.toString()) ||
    order.items?.some((i) => i.farmerId?.toString() === userId.toString());
  const isAdmin = ['ADMIN', 'LOGISTICS_OPERATOR'].includes(userRole);

  if (!isBuyer && !isFarmer && !isAdmin) {
    throw new ApiError(403, 'You do not have authorization to view this invoice.', 'FORBIDDEN');
  }

  return order;
};

/**
 * Cancel order by buyer (Consumer or Business) with custom reason and refund request
 */
const cancelBuyerOrder = async ({ orderId, buyerId, reason, req }) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
  const query = isObjectId ? { _id: orderId } : { orderId };

  const order = await Order.findOne(query).populate('deliveryId');
  if (!order) {
    throw new ApiError(404, 'Order not found.', 'NOT_FOUND');
  }

  // Ensure buyer owns this order
  if (order.buyerId?.toString() !== buyerId.toString()) {
    throw new ApiError(403, 'You are not authorized to cancel this order.', 'FORBIDDEN');
  }

  if (['CANCELLED', 'DELIVERED'].includes(order.status)) {
    throw new ApiError(400, `Order is already in ${order.status} state.`, 'INVALID_STATUS');
  }

  if (['PACKED', 'ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status)) {
    throw new ApiError(
      400,
      'Order has already been packed/dispatched by the farmer and cannot be cancelled directly.',
      'DISPATCHED'
    );
  }

  const customReason = reason?.trim() || 'Cancellation requested by buyer';

  order.status = 'CANCELLED';
  order.cancelledReason = customReason;
  order.cancelledBy = 'BUYER';
  order.cancelledAt = new Date();
  order.refundStatus = 'REFUND_REQUESTED';
  order.refundReason = customReason;
  order.refundRequestedAt = new Date();

  await order.save();

  // Restore inventory back to product and batch
  for (const item of order.items) {
    if (item.productId) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { availableQuantity: item.quantity },
        $set: { status: 'ACTIVE' },
      });
    }
    if (item.batchId) {
      await ProduceBatch.findByIdAndUpdate(item.batchId, {
        $inc: { availableQuantity: item.quantity },
        $set: { listingStatus: 'LISTED_FULL' },
      });
    }
  }

  // Sync state to Delivery
  if (order.deliveryId) {
    let delivery = await Delivery.findById(order.deliveryId);
    if (!delivery && mongoose.Types.ObjectId.isValid(order.deliveryId)) {
      delivery = await Delivery.findOne({ orderId: order._id });
    }
    if (delivery) {
      delivery.status = 'CANCELLED';
      delivery.trackingEvents.push({
        status: 'CANCELLED',
        location: delivery.dropAddress?.city || 'Buyer Location',
        note: `Order cancelled by buyer. Reason: ${customReason}. Refund requested.`,
        updatedBy: buyerId,
        timestamp: new Date(),
      });
      await delivery.save();
    }
  }

  await logAuditEvent({
    req,
    actorId: buyerId,
    actorRole: 'BUYER',
    action: 'BUYER_ORDER_CANCELLED',
    resource: 'Order',
    resourceId: order._id,
    result: 'SUCCESS',
    metadata: { orderId: order.orderId, reason: customReason },
  });

  return order;
};

module.exports = {
  createOrder,
  getOrdersForBuyer,
  getOrdersForFarmer,
  getOrderById,
  updateOrderStatus,
  cancelBuyerOrder,
  calculateDeliveryFee,
  calculateHaversineDistanceKm,
  previewOrderQuote,
  getOrderInvoice,
};
