const { consultKhetiAI, assessProduceQuality } = require('../services/geminiService');
const AIConversation = require('../models/AIConversation');
const FarmerProfile = require('../models/FarmerProfile');
const { success, error } = require('../utils/response');

const chat = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    // Fetch farm context for personalized advice
    const farmerProfile = await FarmerProfile.findOne({ userId });

    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({ _id: conversationId, userId });
    }

    if (!conversation) {
      conversation = await AIConversation.create({
        userId,
        title: message.substring(0, 40) + '...',
        messages: [],
      });
    }

    // Call Kheti AI
    const result = await consultKhetiAI({
      userMessage: message,
      conversationHistory: conversation.messages,
      farmContext: farmerProfile
        ? {
            cropsGrown: farmerProfile.cropsGrown,
            location: farmerProfile.location,
            soilType: farmerProfile.soilType,
          }
        : {},
    });

    // Save interaction
    conversation.messages.push({ role: 'user', content: message });
    conversation.messages.push({ role: 'model', content: result.reply });
    conversation.totalTokensUsed = (conversation.totalTokensUsed || 0) + (result.tokensUsed || 0);
    conversation.lastActivityAt = new Date();
    await conversation.save();

    return success(res, {
      conversationId: conversation._id,
      reply: result.reply,
      source: result.source,
    });
  } catch (err) {
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const list = await AIConversation.find({ userId: req.user.id })
      .select('title lastActivityAt totalTokensUsed createdAt')
      .sort({ lastActivityAt: -1 })
      .limit(20);
    return success(res, list);
  } catch (err) {
    next(err);
  }
};

const getConversationById = async (req, res, next) => {
  try {
    const convo = await AIConversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!convo) return error(res, 'Conversation not found', 'NOT_FOUND', 404);
    return success(res, convo);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  chat,
  getConversations,
  getConversationById,
};
