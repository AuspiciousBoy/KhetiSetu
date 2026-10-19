const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'model', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const AIConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'Agricultural Consultation',
      maxlength: 120,
    },
    messages: [ChatMessageSchema],
    language: {
      type: String,
      enum: ['en', 'hi', 'hinglish', 'auto'],
      default: 'auto',
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AIConversationSchema.index({ userId: 1, lastActivityAt: -1 });

module.exports = mongoose.model('AIConversation', AIConversationSchema);
