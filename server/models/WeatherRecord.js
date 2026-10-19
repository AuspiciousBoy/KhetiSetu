const mongoose = require('mongoose');

const WeatherRecordSchema = new mongoose.Schema(
  {
    location: {
      district: { type: String, required: true, index: true },
      state: { type: String, required: true, index: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    current: {
      temperatureC: { type: Number, required: true },
      humidityPercent: { type: Number, required: true },
      rainfallMm: { type: Number, default: 0 },
      windSpeedKmh: { type: Number, default: 0 },
      condition: { type: String, default: 'Clear' },
      uvIndex: { type: Number, default: 5 },
      icon: { type: String, default: 'sunny' },
    },
    forecast: [
      {
        date: { type: Date, required: true },
        tempMaxC: { type: Number, required: true },
        tempMinC: { type: Number, required: true },
        precipitationProbabilityPercent: { type: Number, default: 0 },
        rainfallMm: { type: Number, default: 0 },
        condition: { type: String, default: 'Partly Cloudy' },
      },
    ],
    advisories: [
      {
        category: {
          type: String,
          enum: ['IRRIGATION', 'SPRAYING', 'HARVESTING', 'FERTILIZER', 'WEATHER_ALERT'],
        },
        severity: {
          type: String,
          enum: ['INFO', 'ADVISORY', 'WARNING'],
          default: 'ADVISORY',
        },
        message: { type: String, required: true },
        confidenceLevel: { type: String, default: 'Estimated based on meteorological forecasts' },
      },
    ],
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

WeatherRecordSchema.index({ 'location.district': 1, 'location.state': 1, fetchedAt: -1 });

module.exports = mongoose.model('WeatherRecord', WeatherRecordSchema);
