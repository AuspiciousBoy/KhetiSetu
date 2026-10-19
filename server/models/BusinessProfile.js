const mongoose = require('mongoose');

const BusinessProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: 150,
    },
    businessType: {
      type: String,
      enum: ['RETAILER', 'WHOLESALER', 'FOOD_PROCESSOR', 'SUPERMARKET_CHAIN', 'EXPORTER', 'RESTAURANT', 'INSTITUTION'],
      default: 'WHOLESALER',
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    procurementVolumePerMonthTons: {
      type: Number,
      default: 5,
    },
    deliveryAddresses: [
      {
        warehouseName: { type: String, default: 'Central Warehouse' },
        line1: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BusinessProfile', BusinessProfileSchema);
