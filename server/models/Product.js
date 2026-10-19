const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProduceBatch',
      required: true,
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product listing title is required'],
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: ['VEGETABLE', 'FRUIT', 'GRAIN_CEREAL', 'PULSE', 'OILSEED', 'SPICE', 'CASH_CROP'],
      required: true,
      index: true,
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit in INR is required'],
      min: [0.1, 'Price must be greater than zero'],
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'box', 'crate'],
      default: 'kg',
    },
    minOrderQuantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    maxOrderQuantity: {
      type: Number,
      required: true,
      default: 1000,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available stock cannot be negative'],
    },
    images: [
      {
        type: String,
      },
    ],
    qualityGrade: {
      type: String,
      enum: ['GOOD_QUALITY', 'APPROACHING_SHELF_LIFE', 'UNRATED'],
      default: 'UNRATED',
    },
    isB2C: {
      type: Boolean,
      default: true,
      index: true,
    },
    isB2B: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    location: {
      state: { type: String, required: true },
      district: { type: String, required: true },
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant marketplace filters
ProductSchema.index({ status: 1, isB2C: 1, category: 1, pricePerUnit: 1 });
ProductSchema.index({ status: 1, isB2B: 1, category: 1 });
ProductSchema.index({ farmerId: 1, status: 1 });
ProductSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
