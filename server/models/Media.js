const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalName: {
      type: String,
    },
    mimeType: {
      type: String,
      required: true,
      default: 'image/jpeg',
    },
    size: {
      type: Number,
      required: true,
    },
    // Binary buffer stored directly in MongoDB Atlas (survives container redeploys & restarts)
    data: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Media', MediaSchema);
