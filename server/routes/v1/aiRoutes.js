const express = require('express');
const router = express.Router();
const aiController = require('../../controllers/aiController');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const { aiChatSchema } = require('../../validators/aiValidators');
const { aiLimiter } = require('../../config/rateLimits');

router.use(authenticate);

// Kheti AI consultation with dedicated rate limiter
router.post('/chat', aiLimiter, validate(aiChatSchema), aiController.chat);
router.get('/conversations', aiController.getConversations);
router.get('/conversations/:id', aiController.getConversationById);

module.exports = router;
