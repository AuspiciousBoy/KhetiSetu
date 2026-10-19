const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Do not return by default in queries
    },
    role: {
      type: String,
      enum: ['FARMER', 'CONSUMER', 'BUSINESS', 'ADMIN', 'LOGISTICS_OPERATOR'],
      required: [true, 'User role is required'],
      default: 'CONSUMER',
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    emailPreferences: {
      transactional: { type: Boolean, default: true },
      marketing: { type: Boolean, default: true },
      priceAlerts: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Account lockout virtual check
UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Response DTO transformation
UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    email: this.email,
    fullName: this.fullName,
    phone: this.phone,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    emailPreferences: this.emailPreferences,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
