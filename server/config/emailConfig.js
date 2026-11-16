/**
 * KhetiSetu Email Configuration (Production & Local SMTP)
 * ───────────────────────────────────────────────────
 * Enterprise-grade, resilient SMTP configuration.
 * Automatically sanitizes Gmail App Passwords, supports flexible
 * environment variable aliases, and detects TLS/SSL ports cleanly.
 */

'use strict';

const host = (
  process.env.SMTP_HOST ||
  process.env.EMAIL_HOST ||
  process.env.MAIL_HOST ||
  'smtp.gmail.com'
).trim();

const port = parseInt(
  process.env.SMTP_PORT ||
  process.env.EMAIL_PORT ||
  process.env.MAIL_PORT,
  10
) || 587;

const user = (
  process.env.SMTP_USER ||
  process.env.EMAIL_USER ||
  process.env.MAIL_USER ||
  process.env.MAIL_USERNAME ||
  ''
).trim();

const rawPass = (
  process.env.SMTP_PASS ||
  process.env.SMTP_PASSWORD ||
  process.env.EMAIL_PASS ||
  process.env.EMAIL_PASSWORD ||
  process.env.MAIL_PASS ||
  process.env.MAIL_PASSWORD ||
  ''
).trim();

// Google 16-character App Passwords are generated with spaces (e.g. "xxxx xxxx xxxx xxxx")
// Strip all whitespace so SMTP authentication does not fail with 535-5.7.8
const isGmailHost = host.toLowerCase().includes('gmail') || host.toLowerCase().includes('googlemail');
const pass = isGmailHost ? rawPass.replace(/\s+/g, '') : rawPass;

const from = (
  process.env.SMTP_FROM ||
  process.env.EMAIL_FROM ||
  process.env.MAIL_FROM ||
  (user ? `"KhetiSetu" <${user}>` : '"KhetiSetu" <noreply@khetisetu.com>')
).trim();

const adminEmail = (
  process.env.ADMIN_EMAIL ||
  process.env.SMTP_ADMIN_EMAIL ||
  user ||
  'admin@khetisetu.internal'
).trim();

const appUrl = (
  process.env.FRONTEND_URL ||
  process.env.APP_URL ||
  'http://localhost:5173'
).trim().replace(/\/+$/, '');

const enabledEnv = (process.env.EMAIL_ENABLED || process.env.SMTP_ENABLED || '').toLowerCase().trim();
// Automatically enabled if explicitly "true" OR if valid credentials (user & pass) are supplied
const enabled = enabledEnv === 'true' || (enabledEnv !== 'false' && Boolean(user && pass));

const emailConfig = {
  enabled,
  host,
  port,
  user,
  pass,
  from,
  adminEmail,
  appUrl,
  isGmail: isGmailHost,
};

module.exports = emailConfig;
