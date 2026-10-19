const { z } = require('zod');

const aiChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long (max 2000 characters)'),
  conversationId: z.string().nullable().optional(),
});

module.exports = {
  aiChatSchema,
};
