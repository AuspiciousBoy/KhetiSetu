const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
} = require('../config/env');

// Recommended Argon2id configuration (OWASP guidelines)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 2,    // 2 threads
};

/**
 * Hash a plain password using Argon2id
 */
const hashPassword = async (plainPassword) => {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
};

/**
 * Verify a plain password against an Argon2id hash
 */
const verifyPassword = async (hash, plainPassword) => {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch (err) {
    return false;
  }
};

/**
 * Generate a short-lived access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRY,
      issuer: 'khetisetu.in',
      audience: 'khetisetu-client',
    }
  );
};

/**
 * Generate a long-lived refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      family: payload.family || crypto.randomUUID(),
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRY,
      issuer: 'khetisetu.in',
      audience: 'khetisetu-client',
    }
  );
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET, {
    issuer: 'khetisetu.in',
    audience: 'khetisetu-client',
  });
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'khetisetu.in',
    audience: 'khetisetu-client',
  });
};

/**
 * Hash a token (e.g. refresh token, reset token) for secure database storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a secure cryptographically random token for email verification or password reset
 */
const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
};
