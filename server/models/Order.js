const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProduceBatch',
    },
    batchCode: {
      type: String,
      trim: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    cropName: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      default: 'kg',
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
    },
    lineTotal: {
      type: Number,
      required: true,
      min: [0, 'Line total cannot be negative'],
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    buyerRole: {
      type: String,
      enum: ['CONSUMER', 'BUSINESS'],
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      validate: [(val) => val.length > 0, 'An order must contain at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
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
    paymentStatus: {
      type: String,
      enum: [
        'PENDING_VERIFICATION',
        'ADVANCE_PAID',
        'CONFIRMED',
        'PAID_IN_FULL',
        'CANCELLED',
        'REFUNDED',
        'PAYMENT_REJECTED',
      ],
      default: 'ADVANCE_PAID',
      index: true,
    },
    paymentMethod: {
      type: String,
      default: 'DIRECT_ORDER',
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentProofUrl: {
      type: String,
      trim: true,
    },
    paymentProofUploadedAt: {
      type: Date,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    farmerCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    distanceKm: {
      type: Number,
      default: 15,
      min: 0,
    },
    sellerDetails: {
      farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fullName: { type: String },
      farmName: { type: String },
      phone: { type: String },
      upiId: { type: String },
      location: { type: mongoose.Schema.Types.Mixed },
    },
    buyerDetails: {
      buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fullName: { type: String },
      phone: { type: String },
      email: { type: String },
      role: { type: String },
    },
    farmerPaymentInfo: [
      {
        farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        farmerName: { type: String },
        upiId: { type: String },
        upiQrCodeUrl: { type: String },
        amount: { type: Number },
        advanceAmount: { type: Number },
        pendingAmount: { type: Number },
      },
    ],
    deliveryAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      houseNo: { type: String },
      streetArea: { type: String },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      district: { type: String },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    cancelledReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
      enum: ['BUYER', 'FARMER', 'ADMIN', 'SYSTEM'],
    },
    cancelledAt: {
      type: Date,
    },
    refundStatus: {
      type: String,
      enum: ['NONE', 'REFUND_REQUESTED', 'REFUND_PROCESSED', 'REFUND_REJECTED'],
      default: 'NONE',
    },
    refundReason: {
      type: String,
    },
    refundRequestedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ farmerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
