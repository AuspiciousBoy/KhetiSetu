const mongoose = require('mongoose');

const FarmerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      maxlength: 120,
    },
    location: {
      farmAddress: { type: String, trim: true },
      village: { type: String, trim: true },
      city: { type: String, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, trim: true },
      landmark: { type: String, trim: true },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    paymentSettings: {
      upiId: { type: String, trim: true },
      upiQrCodeUrl: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
      isConfigured: { type: Boolean, default: false },
      updatedAt: { type: Date },
    },
    landSizeAcres: {
      type: Number,
      min: [0, 'Land size cannot be negative'],
      default: 1,
    },
    soilType: {
      type: String,
      enum: ['ALLUVIAL', 'BLACK_REGUR', 'RED_YELLOW', 'LATERITE', 'LOAMY', 'SANDY', 'CLAY', 'OTHER'],
      default: 'ALLUVIAL',
    },
    cropsGrown: [
      {
        type: String,
        trim: true,
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    totalBatchesHarvested: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

FarmerProfileSchema.index({ 'location.state': 1, 'location.district': 1 });

module.exports = mongoose.model('FarmerProfile', FarmerProfileSchema);
