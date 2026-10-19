const mongoose = require('mongoose');

const CropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    hindiName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['VEGETABLE', 'FRUIT', 'GRAIN_CEREAL', 'PULSE', 'OILSEED', 'SPICE', 'CASH_CROP'],
      required: true,
      index: true,
    },
    season: {
      type: String,
      enum: ['KHARIF', 'RABI', 'ZAID', 'ALL_SEASON'],
      default: 'ALL_SEASON',
    },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'box', 'crate'],
      default: 'kg',
    },
    standardPriceRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    typicalShelfLifeDays: {
      type: Number,
      default: 7,
    },
    optimalStorageTempC: {
      type: Number,
      default: 20,
    },
    imageUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Crop', CropSchema);
