const logger = require('../utils/logger');
const { isProd } = require('../config/env');

const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';

  // Log full error details to internal server logs only
  logger.error('Unhandled API Error', {
    requestId,
    userId: req.user ? req.user.id : null,
    route: req.originalUrl,
    method: req.method,
    name: err.name,
    message: err.message,
    stack: isProd ? undefined : err.stack,
  });

  // Handle specific known error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters provided',
        requestId,
        details: isProd ? undefined : Object.values(err.errors || {}).map((e) => e.message),
      },
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_RESOURCE_ID',
        message: 'The requested resource identifier format is invalid',
        requestId,
      },
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'A resource with this identifier or unique attribute already exists',
        requestId,
      },
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Authentication token is invalid or corrupted',
        requestId,
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication session expired. Please refresh your session.',
        requestId,
      },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const safeMessage = isProd && statusCode === 500
    ? 'An unexpected error occurred while processing your request'
    : err.message || 'Unable to process request';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: safeMessage,
      requestId,
    },
  });
};

module.exports = errorHandler;
