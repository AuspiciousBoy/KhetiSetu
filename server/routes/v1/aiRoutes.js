const express = require('express');
const router = express.Router();
const aiController = require('../../controllers/aiController');
const authenticate = require('../../middleware/authenticate');
const optionalAuthenticate = require('../../middleware/optionalAuthenticate');
const validate = require('../../middleware/validate');
const { aiChatSchema } = require('../../validators/aiValidators');
const { aiLimiter } = require('../../config/rateLimits');

// AI Engine status check (reports whether Gemini API is active or local agronomy fallback)
router.get('/status', aiController.getStatus);

// Kheti AI consultation with dedicated rate limiter
// Optional auth allows both authenticated users (with conversation history) and guest visitors
router.post('/chat', optionalAuthenticate, aiLimiter, validate(aiChatSchema), aiController.chat);

// Saved conversation history endpoints require authentication
router.get('/conversations', authenticate, aiController.getConversations);
router.get('/conversations/:id', authenticate, aiController.getConversationById);

module.exports = router;
