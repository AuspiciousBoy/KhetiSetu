const mongoose = require('mongoose');

const ConsumerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    addresses: [
      {
        title: { type: String, default: 'Home' },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        district: { type: String },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    preferences: {
      organicOnly: { type: Boolean, default: false },
      favoriteCrops: [{ type: String }],
      notificationsEnabled: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ConsumerProfile', ConsumerProfileSchema);
