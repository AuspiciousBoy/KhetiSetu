/**
 * KhetiSetu Email Configuration (Testing & Local SMTP)
 * ───────────────────────────────────────────────────
 * Simplified SMTP configuration for testing.
 * Uses only standard SMTP parameters: HOST, PORT, USER, PASS.
 */

'use strict';

const emailConfig = {
  /** Master toggle for sending emails (true = active, false = silent) */
  enabled: process.env.EMAIL_ENABLED === 'true',

  /** Standard SMTP server host (e.g. smtp.gmail.com, localhost, or Mailtrap) */
  host: process.env.SMTP_HOST || 'smtp.gmail.com',

  /** Standard SMTP server port (587 for TLS, 465 for SSL) */
  port: parseInt(process.env.SMTP_PORT, 10) || 587,

  /** SMTP username / email address */
  user: process.env.SMTP_USER || '',

  /** SMTP password or 16-character Gmail App Password */
  pass: process.env.SMTP_PASS || '',

  /** Destination for admin alerts during testing (defaults to tester's SMTP_USER) */
  adminEmail: process.env.SMTP_USER || 'admin@khetisetu.internal',

  /** Web app base URL for links in email templates */
  appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

module.exports = emailConfig;
