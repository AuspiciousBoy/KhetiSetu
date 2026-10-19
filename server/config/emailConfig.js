/**
 * KhetiSetu Email Configuration
 * ──────────────────────────────
 * Centralizes all SMTP / transactional email settings.
 * All secrets are read from environment — NEVER hardcode credentials here.
 */

'use strict';

const emailConfig = {
  /** Whether to dispatch any emails at all */
  enabled: process.env.EMAIL_ENABLED !== 'false',

  /** Provider: 'resend' | 'nodemailer' */
  provider: process.env.SMTP_PROVIDER || 'resend',

  /** Resend API key (send-only scope) */
  resendApiKey: process.env.RESEND_API_KEY || '',

  /** Sender identity */
  from: {
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@khetisetu.in',
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

  /** Nodemailer SMTP fallback (for local dev without Resend) */
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },

  /** Admin email — receives platform alerts and operational emails */
  adminEmail: process.env.ADMIN_EMAIL || 'admin@khetisetu.in',

  /** App base URL used in email CTAs / links */
  appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

module.exports = emailConfig;
