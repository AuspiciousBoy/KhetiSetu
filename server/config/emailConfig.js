/**
 * KhetiSetu Email Configuration
 * ──────────────────────────────
 * Centralizes all SMTP / transactional email settings.
 * Primary Provider: Nodemailer + Gmail OAuth2
 * All secrets are read from environment — NEVER hardcode credentials here.
 */

'use strict';

const emailConfig = {
  /** Whether to dispatch any emails at all */
  enabled: process.env.EMAIL_ENABLED !== 'false',

  /**
   * Primary Provider:
   * 'gmail_oauth2' (default) | 'smtp' | 'resend'
   */
  provider: process.env.SMTP_PROVIDER || 'gmail_oauth2',

  /**
   * Nodemailer + Gmail OAuth2 Configuration
   * Obtains auto-refreshing access tokens via Google Cloud OAuth2 client.
   */
  gmail: {
    user: process.env.GMAIL_USER || process.env.EMAIL_FROM_ADDRESS || '',
    clientId: process.env.GMAIL_CLIENT_ID || '',
    clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
    accessToken: process.env.GMAIL_ACCESS_TOKEN || '',
  },

  /** Standard SMTP / App Password fallback (when OAuth2 tokens not yet generated) */
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false,
    auth: {
      user: process.env.SMTP_USER || process.env.GMAIL_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },

  /** Resend API key (optional secondary provider) */
  resendApiKey: process.env.RESEND_API_KEY || '',

  /** Sender identity */
  from: {
    address: process.env.GMAIL_USER || process.env.EMAIL_FROM_ADDRESS || 'noreply@khetisetu.in',
    name: process.env.EMAIL_FROM_NAME || 'KhetiSetu',
  },

  /** Reply-to address for support inquiries */
  replyTo: process.env.EMAIL_REPLY_TO || 'support@khetisetu.in',

  /**
   * Debug override: when set, ALL emails route to this address regardless of recipient.
   * Must never be set in production (enforced below).
   */
  debugOverride:
    process.env.NODE_ENV !== 'production' ? process.env.EMAIL_DEBUG_OVERRIDE || null : null,

  /** Admin email — receives platform alerts and operational emails */
  adminEmail: process.env.ADMIN_EMAIL || 'admin@khetisetu.in',

  /** App base URL used in email CTAs / links */
  appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

module.exports = emailConfig;
