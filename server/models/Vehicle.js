const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['MINI_TRUCK', 'PICKUP_VAN', 'REFRIGERATED_VAN', 'HEAVY_TRUCK', 'ELECTRIC_LOADER', 'TRACTOR_TROLLEY'],
      required: true,
    },
    capacityKg: {
      type: Number,
      required: true,
      min: 100,
    },
    operatorName: {
      type: String,
      required: true,
      trim: true,
    },
    operatorPhone: {
      type: String,
      required: true,
      trim: true,
    },
    currentDistrict: {
      type: String,
      default: 'Pune',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', VehicleSchema);
