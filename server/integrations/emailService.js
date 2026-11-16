/**
 * KhetiSetu Email Service (Nodemailer SMTP)
 * ──────────────────────────────────────────
 * Production-ready email dispatcher using standard SMTP with TLS/SSL.
 * Includes connection pooling, cloud host timeouts, automatic App Password
 * sanitization, and diagnostic connection verification.
 *
 * Usage:
 *   const { sendEmail, queueEmail, verifySmtpConnection } = require('../integrations/emailService');
 *   queueEmail({ to, template, subject, context });
 */

'use strict';

const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');
const { renderTemplate } = require('../utils/templateEngine');
const logger = require('../utils/logger');

let _transporter = null;

/**
 * Builds a Nodemailer SMTP transporter tailored for cloud & local environments
 */
const createTransporter = () => {
  const isGmail = emailConfig.isGmail || emailConfig.host.includes('gmail');
  const port = Number(emailConfig.port) || 587;
  const isSecure = port === 465;

  const transportOptions = {
    host: emailConfig.host,
    port: port,
    secure: isSecure, // true for 465, false for 587/STARTTLS
    connectionTimeout: 12000, // 12s connection timeout prevents hangs on cloud networks
    greetingTimeout: 10000,
    socketTimeout: 20000,
    dnsTimeout: 10000,
    tls: {
      rejectUnauthorized: false, // Ensures self-signed proxies / cloud egress TLS does not block
    },
  };

  // Attach authentication credentials only if both user and pass are provided
  if (emailConfig.user && emailConfig.pass) {
    transportOptions.auth = {
      user: emailConfig.user,
      pass: emailConfig.pass,
    };
  }

  // If using Gmail, set service alias for automatic fallback
  if (isGmail && isSecure) {
    transportOptions.service = 'gmail';
  }

  return nodemailer.createTransport(transportOptions);
};

/**
 * Lazy-initialised Nodemailer standard SMTP transporter
 */
const getTransporter = (forceNew = false) => {
  if (!_transporter || forceNew) {
    _transporter = createTransporter();
    logger.info(`[EmailService] Nodemailer SMTP initialized with host: ${emailConfig.host}:${emailConfig.port} (User: ${emailConfig.user || 'unauthenticated'})`);
  }
  return _transporter;
};

/**
 * Diagnostic helper: Verifies SMTP credentials and server reachability
 */
const verifySmtpConnection = async () => {
  if (!emailConfig.enabled) {
    logger.info('[EmailService] SMTP email dispatch is disabled (Set SMTP_USER and SMTP_PASS or EMAIL_ENABLED=true to activate).');
    return { success: false, reason: 'EMAIL_DISABLED' };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    logger.info(`[EmailService] SMTP connection to ${emailConfig.host}:${emailConfig.port} verified successfully! Ready to dispatch transactional emails.`);
    return { success: true };
  } catch (err) {
    logger.warn(`[EmailService] SMTP connection verification failed for ${emailConfig.host}: ${err.message}`, {
      code: err.code,
      response: err.response,
      host: emailConfig.host,
      port: emailConfig.port,
    });
    return {
      success: false,
      error: err.message,
      code: err.code || 'SMTP_CONNECTION_ERROR',
      response: err.response,
    };
  }
};

/**
 * Send an email using standard SMTP.
 *
 * @param {object} options
 * @param {string} options.to       - Recipient address
 * @param {string} options.template - Template name (without .hbs)
 * @param {string} options.subject  - Subject line
 * @param {object} options.context  - Variables for template
 */
const sendEmail = async ({ to, template, subject, context = {} }) => {
  if (!to || typeof to !== 'string') {
    logger.warn(`[EmailService] Invalid recipient address "${to}" — skipping email (${template})`);
    return { success: false, reason: 'INVALID_RECIPIENT' };
  }

  if (!emailConfig.enabled) {
    logger.debug(`[EmailService] EMAIL_ENABLED is false — skipping email to ${to} (${template})`);
    return { success: false, reason: 'EMAIL_DISABLED' };
  }

  const fullContext = {
    ...context,
    appUrl: emailConfig.appUrl,
    supportEmail: emailConfig.user || 'support@khetisetu.internal',
    year: new Date().getFullYear(),
    unsubscribeUrl: `${emailConfig.appUrl}/unsubscribe`,
  };

  let html, text;
  try {
    ({ html, text } = renderTemplate(template, fullContext));
  } catch (renderErr) {
    logger.error(`[EmailService] Template render failed for "${template}": ${renderErr.message}`);
    return { success: false, error: renderErr.message };
  }

  try {
    const transporter = getTransporter();
    const fromAddress = emailConfig.from || (emailConfig.user ? `"KhetiSetu" <${emailConfig.user}>` : '"KhetiSetu" <noreply@khetisetu.com>');

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });

    logger.info(`[EmailService] Email sent via SMTP to ${to} (${template})`, {
      messageId: info.messageId,
      response: info.response,
    });
    return { success: true, messageId: info.messageId, info };
  } catch (sendErr) {
    logger.error(`[EmailService] SMTP send failure for "${template}" to ${to}: ${sendErr.message}`, {
      code: sendErr.code,
      response: sendErr.response,
    });
    return { success: false, error: sendErr.message, code: sendErr.code };
  }
};

/**
 * Fire-and-forget wrapper ensuring background execution without blocking caller
 */
const queueEmail = (options) => {
  setImmediate(async () => {
    try {
      await sendEmail(options);
    } catch (err) {
      logger.error(`[EmailService] Unhandled error in queueEmail: ${err.message}`);
    }
  });
};

module.exports = {
  sendEmail,
  queueEmail,
  getTransporter,
  verifySmtpConnection,
};
