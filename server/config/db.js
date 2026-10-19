const mongoose = require('mongoose');
const { MONGO_URI, isProd } = require('./env');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const options = {
      autoIndex: !isProd, // In production, build indexes via migrations/scripts
      maxPoolSize: 25,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // IPv4
    };

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Reconnecting...');
    });

    await mongoose.connect(MONGO_URI, options);
  } catch (error) {
    logger.error('Failed to connect to MongoDB on startup', { error: error.message });
    if (isProd) {
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected cleanly');
  } catch (err) {
    logger.error('Error during MongoDB disconnect', { error: err.message });
  }
};

module.exports = { connectDB, disconnectDB };
