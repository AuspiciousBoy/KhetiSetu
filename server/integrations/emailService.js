/**
 * KhetiSetu Email Service (Nodemailer SMTP)
 * ──────────────────────────────────────────
 * Lightweight, testing-focused email dispatcher using standard SMTP.
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

let _transporter = null;

/**
 * Lazy-initialised Nodemailer standard SMTP transporter
 */
const getTransporter = () => {
  if (!_transporter) {
    const isGmail = emailConfig.host.includes('gmail');
    const transportOptions = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: emailConfig.user,
            pass: emailConfig.pass,
          },
        }
      : {
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.port === 465,
          auth: {
            user: emailConfig.user,
            pass: emailConfig.pass,
          },
        };

    _transporter = nodemailer.createTransport(transportOptions);
    logger.info(`[EmailService] Nodemailer SMTP initialized with host: ${emailConfig.host}`);
  }
  return _transporter;
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
  if (!emailConfig.enabled) {
    logger.debug(`[EmailService] EMAIL_ENABLED is not true — skipping email to ${to} (${template})`);
    return;
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
    return;
  }

  try {
    const transporter = getTransporter();
    const fromAddress = emailConfig.user
      ? `KhetiSetu <${emailConfig.user}>`
      : 'KhetiSetu <noreply@khetisetu.internal>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text,
    });

    logger.info(`[EmailService] Email sent via SMTP to ${to} (${template})`, {
      messageId: info.messageId,
    });
    return info;
  } catch (sendErr) {
    logger.error(`[EmailService] SMTP send failure for "${template}" to ${to}: ${sendErr.message}`);
  }
};

/**
 * Fire-and-forget wrapper ensuring background execution without blocking caller
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
  getTransporter,
};
