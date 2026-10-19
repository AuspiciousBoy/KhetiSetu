const mongoose = require('mongoose');

const QualityAssessmentSchema = new mongoose.Schema(
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
    imageUrl: {
      type: String,
      required: true,
    },
    classification: {
      type: String,
      enum: ['GOOD_QUALITY', 'APPROACHING_SHELF_LIFE', 'QUALITY_CRITERIA_NOT_MET'],
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    observations: [
      {
        type: String,
        trim: true,
      },
    ],
    estimatedShelfLife: {
      type: String,
      required: true,
    },
    recommendedAction: {
      type: String,
      required: true,
    },
    assessedAt: {
      type: Date,
      default: Date.now,
    },
    disclaimer: {
      type: String,
      default: 'AI-assisted visual estimate only. This does not constitute certified laboratory food-safety or statutory chemical testing.',
    },
    modelVersion: {
      type: String,
      default: 'gemini-1.5-flash-produce-v1',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('QualityAssessment', QualityAssessmentSchema);
