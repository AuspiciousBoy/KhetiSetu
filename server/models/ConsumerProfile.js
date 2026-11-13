const mongoose = require('mongoose');

const ConsumerAddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' }, // Home, Work, Other
    title: { type: String }, // Legacy compatibility
    fullName: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    houseNo: { type: String, trim: true },
    streetArea: { type: String, trim: true },
    line1: { type: String, required: [true, 'Address line 1 is required'], trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    district: { type: String, trim: true },
    state: { type: String, required: [true, 'State is required'], trim: true },
    pincode: { type: String, required: [true, 'PIN code is required'], trim: true },
    landmark: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ConsumerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    addresses: [ConsumerAddressSchema],
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
