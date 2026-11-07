const { consultKhetiAI, assessProduceQuality, getAIStatus: getEngineStatus } = require('../services/geminiService');
const AIConversation = require('../models/AIConversation');
const FarmerProfile = require('../models/FarmerProfile');
const { success, error } = require('../utils/response');
const mongoose = require('mongoose');

const getStatus = async (req, res, next) => {
  try {
    const status = getEngineStatus();
    return success(res, status);
  } catch (err) {
    next(err);
  }
};

const chat = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?.id;

    let farmerProfile = null;
    let conversation = null;

    // If authenticated, fetch farm context and previous conversation
    if (userId) {
      farmerProfile = await FarmerProfile.findOne({ userId }).catch(() => null);

      if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
        conversation = await AIConversation.findOne({ _id: conversationId, userId }).catch(() => null);
      }

      if (!conversation) {
        try {
          conversation = await AIConversation.create({
            userId,
            title: message.substring(0, 40) + '...',
            messages: [],
          });
        } catch {
          // If conversation creation fails, continue gracefully
          conversation = null;
        }
      }
    }

    // Call Kheti AI
    const result = await consultKhetiAI({
      userMessage: message,
      conversationHistory: conversation ? conversation.messages : [],
      farmContext: farmerProfile
        ? {
            cropsGrown: farmerProfile.cropsGrown,
            location: farmerProfile.location,
            soilType: farmerProfile.soilType,
          }
        : {},
    });

    // Save interaction if authenticated conversation exists
    if (conversation) {
      try {
        conversation.messages.push({ role: 'user', content: message });
        conversation.messages.push({ role: 'model', content: result.reply });
        conversation.totalTokensUsed = (conversation.totalTokensUsed || 0) + (result.tokensUsed || 0);
        conversation.lastActivityAt = new Date();
        await conversation.save();
      } catch {
        // Non-blocking save failure
      }
    }

    return success(res, {
      conversationId: conversation ? conversation._id : null,
      reply: result.reply,
      source: result.source,
      tokensUsed: result.tokensUsed || 0,
    });
  } catch (err) {
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return success(res, []);
    }
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
    if (!req.user?.id) {
      return error(res, 'Authentication required to view saved conversations', 'UNAUTHORIZED', 401);
    }
    const convo = await AIConversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!convo) return error(res, 'Conversation not found', 'NOT_FOUND', 404);
    return success(res, convo);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStatus,
  chat,
  getConversations,
  getConversationById,
};
