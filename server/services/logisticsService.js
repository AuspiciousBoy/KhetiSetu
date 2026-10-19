const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { logAuditEvent } = require('../middleware/auditLogger');
const mongoose = require('mongoose');
const { queueEmail } = require('../integrations/emailService');
const emailConfig = require('../config/emailConfig');

/**
 * Validate and transition delivery status according to the finite state machine
 */
const updateDeliveryStatus = async ({
  deliveryId,
  newStatus,
  location,
  note,
  operatorId,
  actorRole,
  req,
}) => {
  const query = mongoose.Types.ObjectId.isValid(deliveryId)
    ? { $or: [{ _id: deliveryId }, { deliveryId }] }
    : { deliveryId };
  const delivery = await Delivery.findOne(query);

  if (!delivery) {
    throw new Error('Delivery record not found.');
  }

  // State Machine Validation
  if (!delivery.canTransitionTo(newStatus)) {
    throw new Error(`Invalid delivery state transition: Cannot move from "${delivery.status}" to "${newStatus}".`);
  }

  // Role permissions check for state transition
  // Farmers can transition to PACKED
  // Admin and Logistics Operator can transition to ASSIGNED, OUT_FOR_DELIVERY, DELIVERED
  if (['CONFIRMED', 'PACKED'].includes(newStatus) && !['FARMER', 'ADMIN'].includes(actorRole)) {
    throw new Error('Only the fulfilling farmer or administrator can confirm and pack orders.');
  }

  if (['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(newStatus) && !['ADMIN', 'LOGISTICS_OPERATOR'].includes(actorRole)) {
    throw new Error('Only authorized logistics dispatchers or administrators can perform dispatch updates.');
  }

  delivery.status = newStatus;
  delivery.trackingEvents.push({
    status: newStatus,
    location: location || 'Transit Hub',
    note: note || `Status progressed to ${newStatus}`,
    updatedBy: req?.user?.id,
    timestamp: new Date(),
  });

  if (newStatus === 'DELIVERED') {
    delivery.actualDeliveryDate = new Date();
  }

  await delivery.save();

  // Sync state back to the linked Order
  const order = await Order.findById(delivery.orderId);
  if (order) {
    order.status = newStatus;
    if (newStatus === 'DELIVERED' && order.paymentMethod === 'CASH_ON_DELIVERY') {
      order.paymentStatus = 'PAID';
    }
    await order.save();
  }

  await logAuditEvent({
    req,
    action: 'DELIVERY_STATUS_TRANSITIONED',
    resource: 'Delivery',
    resourceId: delivery._id,
    result: 'SUCCESS',
    metadata: { previousStatus: delivery.status, newStatus, deliveryId: delivery.deliveryId },
  });

  // Asynchronously dispatch delivery stage emails
  setImmediate(async () => {
    try {
      if (!order) return;
      const [buyer, farmer, vehicle] = await Promise.all([
        User.findById(order.buyerId).select('email fullName emailPreferences'),
        User.findById(order.farmerId).select('email fullName'),
        delivery.vehicleId ? Vehicle.findById(delivery.vehicleId).select('registrationNumber operatorName') : null,
      ]);

      if (!buyer || !buyer.email) return;

      const farmName = farmer?.fullName ? `${farmer.fullName}'s Farm` : 'Farm Partner';
      const trackingUrl = `${emailConfig.appUrl}/track/${order.orderId}`;

      if (newStatus === 'PACKED') {
        queueEmail({
          to: buyer.email,
          template: 'order-packed',
          subject: `Your Order is Packed 📦 — ${order.orderId} — KhetiSetu`,
          context: {
            buyerName: buyer.fullName || 'Customer',
            orderId: order.orderId,
            farmName,
            estimatedDelivery: delivery.estimatedDeliveryDate,
            trackingUrl,
          },
          user: buyer,
        });
      } else if (newStatus === 'OUT_FOR_DELIVERY') {
        queueEmail({
          to: buyer.email,
          template: 'order-dispatched',
          subject: `Your KhetiSetu order is on its way 🚚 — ${order.orderId}`,
          context: {
            buyerName: buyer.fullName || 'Customer',
            orderId: order.orderId,
            farmName,
            driverName: vehicle?.operatorName || 'Assigned Logistics Driver',
            vehicleNumber: vehicle?.registrationNumber || 'Dispatch Fleet',
            trackingUrl,
          },
          user: buyer,
        });
      } else if (newStatus === 'DELIVERED') {
        queueEmail({
          to: buyer.email,
          template: 'order-delivered-buyer',
          subject: `Delivered! ✓ Your KhetiSetu order ${order.orderId}`,
          context: {
            buyerName: buyer.fullName || 'Customer',
            orderId: order.orderId,
            farmName,
            items: order.items,
            deliveredAt: delivery.actualDeliveryDate || new Date(),
            reviewUrl: `${emailConfig.appUrl}/consumer/orders`,
          },
          user: buyer,
        });
      } else if (newStatus === 'CANCELLED') {
        queueEmail({
          to: buyer.email,
          template: 'order-cancelled',
          subject: `Order Cancelled — ${order.orderId} — KhetiSetu`,
          context: {
            buyerName: buyer.fullName || 'Customer',
            orderId: order.orderId,
            reason: note || 'Order was cancelled',
            marketplaceUrl: `${emailConfig.appUrl}/marketplace`,
          },
          user: buyer,
        });
      }
    } catch (err) {
      // Async failure is non-fatal
    }
  });

  return delivery;
};

/**
 * Assign vehicle and driver to a delivery
 */
const assignVehicle = async ({ deliveryId, vehicleId, req }) => {
  const query = mongoose.Types.ObjectId.isValid(deliveryId)
    ? { $or: [{ _id: deliveryId }, { deliveryId }] }
    : { deliveryId };
  const delivery = await Delivery.findOne(query);
  if (!delivery) throw new Error('Delivery not found.');

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle || !vehicle.isActive) throw new Error('Vehicle not found or out of service.');

  delivery.vehicleId = vehicle._id;
  delivery.status = 'ASSIGNED';
  delivery.trackingEvents.push({
    status: 'ASSIGNED',
    location: vehicle.currentDistrict,
    note: `Assigned to logistics vehicle ${vehicle.registrationNumber} (${vehicle.operatorName})`,
    timestamp: new Date(),
  });

  await delivery.save();

  // Sync with order
  await Order.findByIdAndUpdate(delivery.orderId, { status: 'ASSIGNED' });

  await logAuditEvent({
    req,
    action: 'DELIVERY_VEHICLE_ASSIGNED',
    resource: 'Delivery',
    resourceId: delivery._id,
    result: 'SUCCESS',
    metadata: { vehicle: vehicle.registrationNumber },
  });

  return delivery;
};

/**
 * List deliveries for admin/logistics view
 */
const listDeliveries = async ({ page = 1, limit = 20, status }) => {
  const query = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [deliveries, total] = await Promise.all([
    Delivery.find(query)
      .populate('vehicleId')
      .populate('orderId', 'orderId total paymentStatus items')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Delivery.countDocuments(query),
  ]);

  return { deliveries, total, page, limit };
};

module.exports = {
  updateDeliveryStatus,
  assignVehicle,
  listDeliveries,
};
