const mongoose = require('mongoose');

const DeliveryTrackingEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        'PLACED',
        'CONFIRMED',
        'PACKED',
        'ASSIGNED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    note: {
      type: String,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const DeliverySchema = new mongoose.Schema(
  {
    deliveryId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    assignedOperatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    pickupAddress: {
      farmName: { type: String },
      line1: { type: String, required: true },
      district: { type: String, required: true },
      state: { type: String, required: true },
      phone: { type: String },
    },
    dropAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      phone: { type: String, required: true },
    },
    status: {
      type: String,
      enum: [
        'PLACED',
        'CONFIRMED',
        'PACKED',
        'ASSIGNED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ],
      default: 'PLACED',
      index: true,
    },
    distanceKm: {
      type: Number,
      default: 25,
    },
    estimatedTransportCost: {
      type: Number,
      default: 150,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    trackingEvents: [DeliveryTrackingEventSchema],
  },
  {
    timestamps: true,
  }
);

// State transition validation matrix
const VALID_TRANSITIONS = {
  PLACED: ['CONFIRMED', 'PACKED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

DeliverySchema.methods.canTransitionTo = function (nextStatus) {
  const allowed = VALID_TRANSITIONS[this.status] || [];
  return allowed.includes(nextStatus);
};

module.exports = mongoose.model('Delivery', DeliverySchema);
