const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const FarmerProfile = require('../models/FarmerProfile');
const ConsumerProfile = require('../models/ConsumerProfile');
const BusinessProfile = require('../models/BusinessProfile');
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
} = require('../utils/tokens');
const { logAuditEvent } = require('../middleware/auditLogger');
const logger = require('../utils/logger');
const { queueEmail } = require('../integrations/emailService');
const emailConfig = require('../config/emailConfig');

// Progressive delay configuration: max 5 failed attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Register a new user with strict role allowlist and profile instantiation
 */
const register = async ({ email, password, fullName, phone, role, profileData, req }) => {
  // Public registration role allowlist: ADMIN cannot be registered publicly
  const allowedPublicRoles = ['FARMER', 'CONSUMER', 'BUSINESS'];
  const userRole = role && allowedPublicRoles.includes(role.toUpperCase())
    ? role.toUpperCase()
    : 'CONSUMER';

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = generateRandomToken(32);
  const tokenHash = hashToken(verificationToken);

  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    phone,
    role: userRole,
    isEmailVerified: false,
    emailVerificationToken: tokenHash,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Automatically initialize role profile
  if (userRole === 'FARMER') {
    await FarmerProfile.create({
      userId: user._id,
      farmName: profileData?.farmName || `${fullName}'s Farm`,
      location: {
        state: profileData?.state || 'Maharashtra',
        district: profileData?.district || 'Pune',
        village: profileData?.village || '',
      },
      landSizeAcres: profileData?.landSizeAcres || 2,
      cropsGrown: profileData?.cropsGrown || ['Tomato', 'Onion'],
    });
  } else if (userRole === 'CONSUMER') {
    await ConsumerProfile.create({
      userId: user._id,
      addresses: profileData?.address ? [profileData.address] : [],
    });
  } else if (userRole === 'BUSINESS') {
    await BusinessProfile.create({
      userId: user._id,
      businessName: profileData?.businessName || `${fullName} Agro Enterprises`,
      gstNumber: profileData?.gstNumber || '',
      businessType: profileData?.businessType || 'WHOLESALER',
    });
  }

  await logAuditEvent({
    req,
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_REGISTERED',
    resource: 'User',
    resourceId: user._id,
    result: 'SUCCESS',
    metadata: { role: userRole },
  });

  // Issue session tokens immediately
  const family = generateRandomToken(16);
  const accessToken = generateAccessToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    id: user._id,
    family,
  });

  const rfExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    family,
    expiresAt: rfExpires,
    ipAddress: req?.ip,
    userAgent: req?.headers ? req.headers['user-agent'] : undefined,
  });

  // Transactional Email Lifecycle: Welcome Email according to Role
  if (userRole === 'FARMER') {
    queueEmail({
      to: user.email,
      template: 'welcome-farmer',
      subject: `🌾 खेतीसेतु में आपका स्वागत है, ${fullName}! — KhetiSetu`,
      context: {
        farmerName: fullName,
        farmName: profileData?.farmName || `${fullName}'s Farm`,
        location: {
          district: profileData?.district || 'Pune',
          state: profileData?.state || 'Maharashtra',
        },
        dashboardUrl: `${emailConfig.appUrl}/farmer/batches`,
      },
      user,
    });
  } else if (userRole === 'BUSINESS') {
    queueEmail({
      to: user.email,
      template: 'welcome-business',
      subject: `Your KhetiSetu Business Account is Ready — Direct Farm Sourcing Awaits`,
      context: {
        contactName: fullName,
        businessName: profileData?.businessName || `${fullName} Agro Enterprises`,
        b2bUrl: `${emailConfig.appUrl}/marketplace?mode=b2b`,
      },
      user,
    });
  } else if (userRole === 'ADMIN') {
    queueEmail({
      to: user.email,
      template: 'welcome-admin',
      subject: `KhetiSetu Admin Account Provisioned`,
      context: {
        name: fullName,
        adminUrl: `${emailConfig.appUrl}/admin`,
      },
      user,
    });
  } else {
    // CONSUMER
    queueEmail({
      to: user.email,
      template: 'welcome-consumer',
      subject: `Welcome to KhetiSetu, ${fullName}! Fresh from farm to your door 🥦`,
      context: {
        name: fullName,
        marketplaceUrl: `${emailConfig.appUrl}/marketplace`,
      },
      user,
    });
  }

  // Account Verification Email
  const verifyUrl = `${emailConfig.appUrl}/verify-email?token=${verificationToken}`;
  queueEmail({
    to: user.email,
    template: 'verify-email',
    subject: `[Action Required] Verify your KhetiSetu email address`,
    context: {
      name: fullName,
      verifyUrl,
    },
    user,
  });

  // Admin Notification for sensitive roles (FARMER / BUSINESS)
  if (['FARMER', 'BUSINESS'].includes(userRole)) {
    queueEmail({
      to: emailConfig.adminEmail,
      template: 'admin-alert',
      subject: `[Admin Notice] New ${userRole} Registered: ${fullName}`,
      context: {
        alertTitle: `New ${userRole} Registered`,
        alertMessage: `A new ${userRole.toLowerCase()} account has joined the platform and is ready for onboarding.`,
        details: {
          Role: userRole,
          Name: fullName,
          Email: user.email,
          Phone: phone || 'N/A',
          RegisteredAt: new Date().toISOString(),
        },
        adminUrl: `${emailConfig.appUrl}/admin`,
      },
    });
  }

  return {
    user: user.toPublicJSON(),
    accessToken,
    refreshToken,
    verificationToken, // Provided in development for easy verification testing
  };
};

/**
 * Authenticate user with progressive delays, lockout enforcement, and token rotation
 */
const login = async ({ email, password, req }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash +failedLoginAttempts +lockUntil'
  );

  if (!user) {
    await logAuditEvent({
      req,
      actorEmail: email,
      action: 'LOGIN_FAILED',
      resource: 'User',
      result: 'FAILURE',
      metadata: { reason: 'User not found' },
    });
    throw new Error('Invalid email or password credentials.');
  }

  // Account lockout check
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    await logAuditEvent({
      req,
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'LOGIN_BLOCKED_ACCOUNT_LOCKED',
      resource: 'User',
      resourceId: user._id,
      result: 'BLOCKED',
    });
    throw new Error(`Account temporarily locked due to multiple failed login attempts. Try again in ${remainingMinutes} minutes.`);
  }

  const isMatch = await verifyPassword(user.passwordHash, password);

  if (!isMatch) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await user.save();
      await logAuditEvent({
        req,
        actorId: user._id,
        actorEmail: user.email,
        action: 'ACCOUNT_LOCKED_FAILED_ATTEMPTS',
        resource: 'User',
        resourceId: user._id,
        result: 'WARNING',
      });

      // Email notification to user & admin regarding security event
      const resetUrl = `${emailConfig.appUrl}/forgot-password`;
      queueEmail({
        to: user.email,
        template: 'account-locked',
        subject: `⚠️ KhetiSetu: Your account has been temporarily secured`,
        context: {
          name: user.fullName || 'User',
          failedAttempts: MAX_FAILED_ATTEMPTS,
          resetUrl,
        },
        user,
      });

      queueEmail({
        to: emailConfig.adminEmail,
        template: 'admin-alert',
        subject: `[Security Alert] Account Locked: ${user.email}`,
        context: {
          alertTitle: 'Account Lockout Triggered',
          alertMessage: `User ${user.email} was locked out following ${MAX_FAILED_ATTEMPTS} failed login attempts.`,
          details: {
            Email: user.email,
            IP: req?.ip || 'Unknown',
            UserAgent: req?.headers ? req.headers['user-agent'] : 'Unknown',
            LockUntil: new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString(),
          },
          adminUrl: `${emailConfig.appUrl}/admin`,
        },
      });

      throw new Error('Maximum login attempts exceeded. Account is locked for 15 minutes.');
    }
    await user.save();

    await logAuditEvent({
      req,
      actorId: user._id,
      actorEmail: user.email,
      action: 'LOGIN_FAILED_BAD_PASSWORD',
      resource: 'User',
      resourceId: user._id,
      result: 'FAILURE',
      metadata: { failedAttempts: user.failedLoginAttempts },
    });
    throw new Error('Invalid email or password credentials.');
  }

  // Reset lockout counters upon successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  // Create token family for rotation & reuse detection
  const family = generateRandomToken(16);
  const accessToken = generateAccessToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    id: user._id,
    family,
  });

  const rfExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    family,
    expiresAt: rfExpires,
    ipAddress: req?.ip,
    userAgent: req?.headers ? req.headers['user-agent'] : undefined,
  });

  await logAuditEvent({
    req,
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'USER_LOGIN_SUCCESS',
    resource: 'User',
    resourceId: user._id,
    result: 'SUCCESS',
  });

  return {
    user: user.toPublicJSON(),
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh Access Token with Token Rotation and Reuse Detection
 */
const refreshAccessToken = async ({ rawRefreshToken, req }) => {
  if (!rawRefreshToken) {
    throw new Error('Refresh token is required');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (err) {
    throw new Error('Refresh token is invalid or expired. Please sign in again.');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const existingToken = await RefreshToken.findOne({ tokenHash });

  // REFRESH TOKEN REUSE DETECTION:
  // If the token is not found or is flagged revoked, an attacker or compromised client may be attempting token reuse!
  // Invalidate the entire family immediately to protect the user's account.
  if (!existingToken || existingToken.isRevoked) {
    if (decoded.family) {
      await RefreshToken.updateMany(
        { family: decoded.family },
        { $set: { isRevoked: true } }
      );
      logger.warn('Refresh token reuse detected! Revoked entire token family.', {
        userId: decoded.id,
        family: decoded.family,
        ip: req?.ip,
      });
      await logAuditEvent({
        req,
        actorId: decoded.id,
        action: 'REFRESH_TOKEN_REUSE_DETECTED',
        resource: 'RefreshToken',
        result: 'BLOCKED',
      });
    }
    throw new Error('Compromised session detected. All sessions in this chain have been terminated. Please log in again.');
  }

  // Revoke the current token (Rotation)
  existingToken.isRevoked = true;
  await existingToken.save();

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new Error('User associated with session is no longer active.');
  }

  // Generate new pair under the same family
  const newAccessToken = generateAccessToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });
  const newRefreshToken = generateRefreshToken({
    id: user._id,
    family: existingToken.family,
  });

  const rfExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(newRefreshToken),
    family: existingToken.family,
    expiresAt: rfExpires,
    ipAddress: req?.ip,
    userAgent: req?.headers ? req.headers['user-agent'] : undefined,
  });

  return {
    user: user.toPublicJSON(),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout and revoke refresh token
 */
const logout = async ({ rawRefreshToken, userId, req }) => {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.findOneAndUpdate({ tokenHash }, { $set: { isRevoked: true } });
  }

  if (userId) {
    await logAuditEvent({
      req,
      actorId: userId,
      action: 'USER_LOGOUT',
      resource: 'User',
      resourceId: userId,
      result: 'SUCCESS',
    });
  }

  return { message: 'Logged out successfully' };
};

/**
 * Verify Email Token
 */
const verifyEmail = async ({ token, req }) => {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('Invalid or expired email verification link.');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  await logAuditEvent({
    req,
    actorId: user._id,
    actorEmail: user.email,
    action: 'EMAIL_VERIFIED',
    resource: 'User',
    resourceId: user._id,
    result: 'SUCCESS',
  });

  // Email verification success confirmation
  queueEmail({
    to: user.email,
    template: 'email-verified',
    subject: `Email Verified ✓ — Welcome to KhetiSetu`,
    context: {
      name: user.fullName || 'User',
      loginUrl: `${emailConfig.appUrl}/login`,
    },
    user,
  });

  return { message: 'Email address successfully verified.' };
};

/**
 * Initiate Forgot Password flow (returns generic message to prevent account enumeration)
 */
const forgotPassword = async ({ email, req }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const resetToken = generateRandomToken(32);
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await logAuditEvent({
      req,
      actorId: user._id,
      actorEmail: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      resource: 'User',
      resourceId: user._id,
      result: 'SUCCESS',
    });

    // Dispatch secure single-use password reset link
    const resetUrl = `${emailConfig.appUrl}/reset-password?token=${resetToken}`;
    queueEmail({
      to: user.email,
      template: 'password-reset',
      subject: `KhetiSetu Password Reset — Link expires in 1 hour`,
      context: {
        name: user.fullName || 'User',
        resetUrl,
      },
      user,
    });

    return {
      message: 'If an account exists for this email, password reset instructions have been issued.',
      resetToken, // Returned in dev/test for verification
    };
  }

  return {
    message: 'If an account exists for this email, password reset instructions have been issued.',
  };
};

/**
 * Complete Password Reset
 */
const resetPassword = async ({ token, newPassword, req }) => {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('Password reset link is invalid or has expired.');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  // Invalidate all existing sessions
  await RefreshToken.updateMany({ userId: user._id }, { $set: { isRevoked: true } });

  await logAuditEvent({
    req,
    actorId: user._id,
    actorEmail: user.email,
    action: 'PASSWORD_RESET_COMPLETED',
    resource: 'User',
    resourceId: user._id,
    result: 'SUCCESS',
  });

  // Security notification confirming password modification
  queueEmail({
    to: user.email,
    template: 'password-changed',
    subject: `Security Alert: Your KhetiSetu Password Was Changed`,
    context: {
      name: user.fullName || 'User',
      changedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      loginUrl: `${emailConfig.appUrl}/login`,
    },
    user,
  });

  return { message: 'Password has been successfully updated. Please log in with your new password.' };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
