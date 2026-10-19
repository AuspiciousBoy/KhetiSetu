/**
 * KhetiSetu Email Template Engine
 * ─────────────────────────────────
 * Compiles Handlebars email templates with registered partials.
 * Caches compiled templates in memory for performance.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const { convert: htmlToText } = require('html-to-text');
const logger = require('./logger');

const TEMPLATES_DIR = path.join(__dirname, '../templates/email');
const PARTIALS_DIR = path.join(TEMPLATES_DIR, 'partials');

/** In-memory compiled template cache */
const templateCache = new Map();

/**
 * Register all partials from the /partials directory.
 * Called once at startup.
 */
const registerPartials = () => {
  if (!fs.existsSync(PARTIALS_DIR)) {
    logger.warn('[TemplateEngine] Partials directory not found — skipping partial registration.');
    return;
  }

  const files = fs.readdirSync(PARTIALS_DIR).filter((f) => f.endsWith('.hbs'));
  for (const file of files) {
    const name = path.basename(file, '.hbs');
    const content = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf-8');
    handlebars.registerPartial(name, content);
    logger.debug(`[TemplateEngine] Registered partial: ${name}`);
  }

  logger.info(`[TemplateEngine] ${files.length} email partials registered.`);
};

/** Register Handlebars helpers */
const registerHelpers = () => {
  /** Format a number as Indian Rupee currency: ₹1,234 */
  handlebars.registerHelper('inr', (amount) => {
    if (amount == null) return '—';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  });

  /** Format a JS Date or ISO string to readable date: "19 Oct 2026" */
  handlebars.registerHelper('dateFormat', (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  });

  /** Format a JS Date or ISO string to readable datetime: "19 Oct 2026, 11:05 PM" */
  handlebars.registerHelper('dateTimeFormat', (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  });

  /** Capitalize first letter */
  handlebars.registerHelper('capitalize', (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });

  /** Equality check for conditionals */
  handlebars.registerHelper('eq', (a, b) => a === b);

  /** Classification badge color map */
  handlebars.registerHelper('gradeColor', (classification) => {
    const map = {
      PREMIUM_QUALITY: '#2e7d32',
      GOOD_QUALITY: '#388e3c',
      STANDARD_QUALITY: '#f57f17',
      BELOW_STANDARD: '#e65100',
      QUALITY_CRITERIA_NOT_MET: '#ba1a1a',
      MIXED_QUALITY: '#785838',
    };
    return map[classification] || '#5a5a5a';
  });
};

/**
 * Compile and render a Handlebars email template.
 * @param {string} templateName - Template filename without extension (e.g., 'welcome-farmer')
 * @param {object} context - Variables to inject into the template
 * @returns {{ html: string, text: string }}
 */
const renderTemplate = (templateName, context = {}) => {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.hbs`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`[TemplateEngine] Template not found: ${templateName}.hbs`);
  }

  let compiledTemplate = templateCache.get(templateName);

  if (!compiledTemplate) {
    const source = fs.readFileSync(templatePath, 'utf-8');
    compiledTemplate = handlebars.compile(source);
    templateCache.set(templateName, compiledTemplate);
    logger.debug(`[TemplateEngine] Compiled and cached template: ${templateName}`);
  }

  const html = compiledTemplate(context);

  const text = htmlToText(html, {
    wordwrap: 80,
    selectors: [
      { selector: 'a', options: { ignoreHref: false } },
      { selector: 'img', format: 'skip' },
      { selector: 'table', options: { uppercaseHeaderCells: false } },
    ],
  });

  return { html, text };
};

/**
 * Clear the compiled template cache.
 * Useful for hot-reloading templates in development.
 */
const clearCache = () => {
  templateCache.clear();
  logger.debug('[TemplateEngine] Template cache cleared.');
};

// Initialize on module load
registerHelpers();
registerPartials();

module.exports = {
  renderTemplate,
  registerPartials,
  clearCache,
};
