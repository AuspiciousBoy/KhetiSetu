const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../../validators/authValidators');
const {
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} = require('../../config/rateLimits');

// Public Auth Endpoints with dedicated rate limits
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.get('/verify-email/:token', emailVerificationLimiter, authController.verifyEmail);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Protected Auth Endpoints
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
