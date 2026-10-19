/**
 * KhetiSetu Email Service
 * ────────────────────────
 * Production-grade transactional email dispatcher.
 * Supports Resend (primary) with Nodemailer as local SMTP fallback.
 * All sends are async — email failures NEVER block the calling API request.
 *
 * Usage:
 *   const { sendEmail } = require('../integrations/emailService');
 *   sendEmail({ to, template, subject, context });
 */

'use strict';

const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');
const { renderTemplate } = require('../utils/templateEngine');
const logger = require('../utils/logger');

/** Lazy-initialised Resend client */
let _resendClient = null;
const getResendClient = () => {
  if (!_resendClient) {
    if (!emailConfig.resendApiKey) {
      throw new Error('[EmailService] RESEND_API_KEY is not set. Cannot initialise Resend client.');
    }
    _resendClient = new Resend(emailConfig.resendApiKey);
  }
  return _resendClient;
};

/** Lazy-initialised Nodemailer transport */
let _nodemailerTransport = null;
const getNodemailerTransport = () => {
  if (!_nodemailerTransport) {
    _nodemailerTransport = nodemailer.createTransport(emailConfig.smtp);
  }
  return _nodemailerTransport;
};

/**
 * Resolve the effective recipient address.
 * In non-production envs with EMAIL_DEBUG_OVERRIDE set, all mail routes there.
 */
const resolveRecipient = (to) => {
  if (emailConfig.debugOverride) {
    return emailConfig.debugOverride;
  }
  return to;
};

/**
 * Build the from string: "KhetiSetu <noreply@khetisetu.in>"
 */
const buildFrom = () => `${emailConfig.from.name} <${emailConfig.from.address}>`;

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
 * Dispatch email via Nodemailer SMTP.
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

  return { messageId: info.messageId, provider: 'nodemailer' };
};

/**
 * Core email dispatcher.
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
  // Guard: email system globally disabled
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

  const sendFn =
    emailConfig.provider === 'resend' && emailConfig.resendApiKey
      ? sendViaResend
      : sendViaNodemailer;

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

module.exports = { sendEmail, queueEmail };
