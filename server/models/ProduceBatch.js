const mongoose = require('mongoose');

const ProduceBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true,
      index: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Batch quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Available quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: 'kg',
    },
    harvestDate: {
      type: Date,
      required: [true, 'Harvest date is required'],
    },
    storageInformation: {
      method: { type: String, default: 'Room Temperature Well-Ventilated' },
      location: { type: String, default: 'Farm Barn' },
      humidityControl: { type: Boolean, default: false },
    },
    shelfLifeDays: {
      type: Number,
      default: 10,
    },
    qualityAssessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QualityAssessment',
    },
    qualityGrade: {
      type: String,
      enum: ['PENDING_ASSESSMENT', 'GOOD_QUALITY', 'APPROACHING_SHELF_LIFE', 'QUALITY_CRITERIA_NOT_MET'],
      default: 'PENDING_ASSESSMENT',
      index: true,
    },
    listingStatus: {
      type: String,
      enum: ['UNLISTED', 'LISTED_PARTIAL', 'LISTED_FULL', 'DEPLETED', 'ARCHIVED'],
      default: 'UNLISTED',
      index: true,
    },
    originLocation: {
      state: { type: String, required: true },
      district: { type: String, required: true },
      village: { type: String },
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

ProduceBatchSchema.index({ farmerId: 1, listingStatus: 1 });
ProduceBatchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProduceBatch', ProduceBatchSchema);
