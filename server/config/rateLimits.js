const rateLimit = require('express-rate-limit');
const { isTest } = require('./env');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max: isTest ? 1000 : max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: message || 'Too many requests. Please try again later.',
      },
    },
    skip: () => isTest,
  });
};

// Global API rate limit: 300 requests per 15 minutes per IP
const globalLimiter = createLimiter(
  15 * 60 * 1000,
  300,
  'Global rate limit exceeded. Please slow down.'
);

// General Auth limiter: 30 requests per 15 minutes
const authLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  'Too many authentication requests from this IP. Please wait.'
);

// Login rate limiter: 10 failed or general login attempts per 15 minutes per IP
const loginLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Account protected by progressive delay and rate limiting.'
);

// Password reset rate limiter: 3 requests per hour
const passwordResetLimiter = createLimiter(
  60 * 60 * 1000,
  5,
  'Too many password reset requests. Please wait an hour.'
);

// Email verification rate limiter: 5 requests per 15 minutes
const emailVerificationLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  'Too many email verification requests.'
);

// AI Assistant & Quality Assessment limiter: 10 requests per minute per IP / per user
const aiLimiter = createLimiter(
  60 * 1000,
  10,
  'AI quota request limit reached. Please wait a minute before sending another query.'
);

// File upload rate limiter: 15 uploads per 10 minutes
const fileUploadLimiter = createLimiter(
  10 * 60 * 1000,
  15,
  'File upload rate limit reached. Please wait before uploading more produce images.'
);

// Order creation rate limiter: 20 orders per 10 minutes (prevents bot spam & stock starvation)
const orderLimiter = createLimiter(
  10 * 60 * 1000,
  20,
  'Order creation limit reached. Please wait before submitting more orders.'
);

// Admin endpoint rate limiter: 100 requests per 5 minutes
const adminLimiter = createLimiter(
  5 * 60 * 1000,
  100,
  'Admin rate limit exceeded.'
);

module.exports = {
  globalLimiter,
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  aiLimiter,
  fileUploadLimiter,
  orderLimiter,
  adminLimiter,
};
