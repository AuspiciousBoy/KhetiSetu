/**
 * KhetiSetu Email Service
 * ────────────────────────
 * Production-grade transactional email dispatcher.
 * Primary Provider: Nodemailer + Gmail OAuth2 (auto-refreshes access tokens via Google Cloud OAuth2)
 * Secondary Fallbacks: Standard Nodemailer SMTP / Resend API
 *
 * All sends are asynchronous — email operations NEVER block the calling API flow.
 *
 * Usage:
 *   const { sendEmail, queueEmail } = require('../integrations/emailService');
 *   queueEmail({ to, template, subject, context });
 */

'use strict';

const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');
const { renderTemplate } = require('../utils/templateEngine');
const logger = require('../utils/logger');

/** Lazy-initialised Gmail OAuth2 transport */
let _gmailOAuth2Transport = null;
const getGmailOAuth2Transport = () => {
  if (!_gmailOAuth2Transport) {
    const { user, clientId, clientSecret, refreshToken, accessToken } = emailConfig.gmail;

    if (!user || !clientId || !clientSecret || !refreshToken) {
      logger.warn(
        '[EmailService] Gmail OAuth2 credentials incomplete. Ensure GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are set in .env. Falling back to SMTP transport.'
      );
      return getNodemailerTransport();
    }

    const authConfig = {
      type: 'OAuth2',
      user,
      clientId,
      clientSecret,
      refreshToken,
    };
    if (accessToken) {
      authConfig.accessToken = accessToken;
    }

    _gmailOAuth2Transport = nodemailer.createTransport({
      service: 'gmail',
      auth: authConfig,
    });

    logger.info(`[EmailService] Nodemailer initialized with Gmail OAuth2 for sender: ${user}`);
  }
  return _gmailOAuth2Transport;
};

/** Lazy-initialised Standard Nodemailer transport (App Password or SMTP relay fallback) */
let _nodemailerTransport = null;
const getNodemailerTransport = () => {
  if (!_nodemailerTransport) {
    _nodemailerTransport = nodemailer.createTransport(emailConfig.smtp);
  }
  return _nodemailerTransport;
};

/** Lazy-initialised Resend client (optional secondary provider) */
let _resendClient = null;
const getResendClient = () => {
  if (!_resendClient) {
    if (!emailConfig.resendApiKey) {
      throw new Error('[EmailService] RESEND_API_KEY is not set. Cannot initialise Resend client.');
    }
    const { Resend } = require('resend');
    _resendClient = new Resend(emailConfig.resendApiKey);
  }
  return _resendClient;
};

/**
 * Resolve effective recipient address.
 * In non-production environments with EMAIL_DEBUG_OVERRIDE set, all mail routes there.
 */
const resolveRecipient = (to) => {
  if (emailConfig.debugOverride) {
    return emailConfig.debugOverride;
  }
  return to;
};

/**
 * Build sender address: "KhetiSetu <user@gmail.com>"
 */
const buildFrom = () => {
  const address = emailConfig.gmail.user || emailConfig.from.address;
  return `${emailConfig.from.name} <${address}>`;
};

/**
 * Dispatch email via Nodemailer + Gmail OAuth2.
 */
const sendViaGmailOAuth2 = async ({ to, subject, html, text }) => {
  const transport = getGmailOAuth2Transport();
  const info = await transport.sendMail({
    from: buildFrom(),
    to,
    replyTo: emailConfig.replyTo,
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<mailto:${emailConfig.replyTo}?subject=unsubscribe>`,
    },
  });

  return { messageId: info.messageId, provider: 'nodemailer-gmail-oauth2' };
};

/**
 * Dispatch email via standard Nodemailer SMTP / App Password.
 */
const sendViaNodemailer = async ({ to, subject, html, text }) => {
  const transport = getNodemailerTransport();
  const info = await transport.sendMail({
    from: buildFrom(),
    to,
    replyTo: emailConfig.replyTo,
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<mailto:${emailConfig.replyTo}?subject=unsubscribe>`,
    },
  });

  return { messageId: info.messageId, provider: 'nodemailer-smtp' };
};

/**
 * Dispatch email via Resend API.
 */
const sendViaResend = async ({ to, subject, html, text }) => {
  const client = getResendClient();
  const { data, error } = await client.emails.send({
    from: buildFrom(),
    to: [to],
    replyTo: emailConfig.replyTo,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
  }

  return { messageId: data?.id, provider: 'resend' };
};

/**
 * Verify transporter connection status (useful for health checks & debugging).
 */
const verifyEmailConnection = async () => {
  if (!emailConfig.enabled) {
    return { ok: true, status: 'DISABLED', message: 'EMAIL_ENABLED is set to false' };
  }

  try {
    if (emailConfig.provider === 'gmail_oauth2' && emailConfig.gmail.refreshToken) {
      const transport = getGmailOAuth2Transport();
      await transport.verify();
      return { ok: true, provider: 'gmail_oauth2', user: emailConfig.gmail.user };
    } else if (emailConfig.provider === 'resend') {
      return { ok: true, provider: 'resend', ready: !!emailConfig.resendApiKey };
    } else {
      const transport = getNodemailerTransport();
      await transport.verify();
      return { ok: true, provider: 'smtp', host: emailConfig.smtp.host };
    }
  } catch (err) {
    logger.error(`[EmailService] Connection verification failed: ${err.message}`);
    return { ok: false, error: err.message };
  }
};

/**
 * Core transactional email dispatcher.
 *
 * @param {object} options
 * @param {string}  options.to           - Recipient email address
 * @param {string}  options.template     - Template name (without .hbs extension)
 * @param {string}  options.subject      - Email subject line
 * @param {object}  options.context      - Handlebars template variables
 * @param {'transactional'|'marketing'} [options.type='transactional']
 * @param {object}  [options.user]       - User object to check email preferences
 * @returns {Promise<void>}  — Fire and forget. Errors are logged, never thrown.
 */
const sendEmail = async ({ to, template, subject, context = {}, type = 'transactional', user = null }) => {
  // Guard: email system globally disabled (e.g. during test runs or silent mode)
  if (!emailConfig.enabled) {
    logger.debug(`[EmailService] EMAIL_ENABLED=false — skipping email to ${to} (${template})`);
    return;
  }

  // Guard: marketing emails respect user opt-out (transactional emails bypass this)
  if (type === 'marketing' && user?.emailPreferences?.marketing === false) {
    logger.debug(`[EmailService] User opted out of marketing emails — skipping ${template}`);
    return;
  }

  const recipient = resolveRecipient(to);

  // Inject global template context
  const fullContext = {
    ...context,
    appUrl: emailConfig.appUrl,
    supportEmail: emailConfig.replyTo,
    year: new Date().getFullYear(),
    unsubscribeUrl: `${emailConfig.appUrl}/unsubscribe`,
  };

  let html, text;
  try {
    ({ html, text } = renderTemplate(template, fullContext));
  } catch (renderErr) {
    logger.error(`[EmailService] Template render failed for "${template}": ${renderErr.message}`);
    return; // Don't block caller
  }

  // Select dispatcher: Nodemailer + Gmail OAuth2 is preferred
  let sendFn;
  if (
    emailConfig.provider === 'gmail_oauth2' ||
    (emailConfig.gmail.clientId && emailConfig.gmail.refreshToken)
  ) {
    sendFn = sendViaGmailOAuth2;
  } else if (emailConfig.provider === 'resend' && emailConfig.resendApiKey) {
    sendFn = sendViaResend;
  } else {
    sendFn = sendViaNodemailer;
  }

  try {
    const result = await sendFn({ to: recipient, subject, html, text });
    logger.info(`[EmailService] Email dispatched via ${result.provider}`, {
      template,
      to: recipient,
      messageId: result.messageId,
    });
  } catch (sendErr) {
    logger.error(`[EmailService] Failed to send email "${template}" to ${recipient}: ${sendErr.message}`);
    // Never rethrow — email failures must not break core API flows
  }
};

/**
 * Fire-and-forget wrapper to ensure callers don't accidentally await and block.
 * This is the preferred way to call sendEmail from services.
 */
const queueEmail = (options) => {
  setImmediate(() => {
    sendEmail(options).catch((err) => {
      logger.error(`[EmailService] Unhandled error in queueEmail: ${err.message}`);
    });
  });
};

module.exports = {
  sendEmail,
  queueEmail,
  verifyEmailConnection,
};
