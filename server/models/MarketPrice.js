const mongoose = require('mongoose');

const MarketPriceSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    market: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pricePerQuintal: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    arrivalTons: {
      type: Number,
      default: 10,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    source: {
      type: String,
      default: 'Agmarknet / APMC Mandi Data Feed',
    },
  },
  {
    timestamps: true,
  }
);

MarketPriceSchema.index({ crop: 1, market: 1, date: -1 });
MarketPriceSchema.index({ state: 1, district: 1, date: -1 });

module.exports = mongoose.model('MarketPrice', MarketPriceSchema);
