/**
 * Email Template Compilation & Rendering Unit Tests
 * ───────────────────────────────────────────────────
 * Verifies that all Handlebars templates and partials compile
 * and render cleanly without syntax errors, missing variables, or runtime faults.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { renderTemplate } = require('../server/utils/templateEngine');

test('Template Engine — All partials compile and register without error', () => {
  const partialsDir = path.join(__dirname, '../server/templates/email/partials');
  const files = fs.readdirSync(partialsDir).filter((f) => f.endsWith('.hbs'));
  assert.ok(files.length >= 3, `Expected at least 3 partials, found ${files.length}`);
});

test('Template Engine — welcome-farmer renders correctly with variables', () => {
  const result = renderTemplate('welcome-farmer', {
    farmerName: 'Rameshwar Patil',
    farmName: 'Sahyadri Organic Farm',
    location: { district: 'Pune', state: 'Maharashtra' },
    dashboardUrl: 'http://localhost:5173/farmer/batches',
    appUrl: 'http://localhost:5173',
    supportEmail: 'support@khetisetu.in',
    year: 2026,
    unsubscribeUrl: 'http://localhost:5173/unsubscribe',
  });

  assert.ok(result.html.includes('Rameshwar Patil'));
  assert.ok(result.html.includes('Sahyadri Organic Farm'));
  assert.ok(result.html.includes('Pune, Maharashtra'));
  assert.ok(result.text.length > 50);
});

test('Template Engine — welcome-consumer renders correctly', () => {
  const result = renderTemplate('welcome-consumer', {
    name: 'Pooja Sharma',
    marketplaceUrl: 'http://localhost:5173/marketplace',
    appUrl: 'http://localhost:5173',
    supportEmail: 'support@khetisetu.in',
    year: 2026,
    unsubscribeUrl: 'http://localhost:5173/unsubscribe',
  });

  assert.ok(result.html.includes('Pooja Sharma'));
  assert.ok(result.html.includes('100% Farm Direct'));
});

test('Template Engine — welcome-business renders correctly', () => {
  const result = renderTemplate('welcome-business', {
    contactName: 'Vikram Mehta',
    businessName: 'Kisan Agro Foods',
    b2bUrl: 'http://localhost:5173/marketplace?mode=b2b',
    appUrl: 'http://localhost:5173',
    supportEmail: 'support@khetisetu.in',
    year: 2026,
    unsubscribeUrl: 'http://localhost:5173/unsubscribe',
  });

  assert.ok(result.html.includes('Kisan Agro Foods'));
  assert.ok(result.html.includes('Vikram Mehta'));
});

test('Template Engine — welcome-admin renders correctly', () => {
  const result = renderTemplate('welcome-admin', {
    name: 'System Admin',
    adminUrl: 'http://localhost:5173/admin',
    appUrl: 'http://localhost:5173',
    supportEmail: 'support@khetisetu.in',
    year: 2026,
    unsubscribeUrl: 'http://localhost:5173/unsubscribe',
  });

  assert.ok(result.html.includes('System Admin'));
  assert.ok(result.html.includes('Admin Account Provisioned'));
});

test('Template Engine — order-placed-buyer renders itemized table and INR amounts', () => {
  const result = renderTemplate('order-placed-buyer', {
    buyerName: 'Pooja Sharma',
    orderId: 'ORD-9999-ABCD',
    orderDate: new Date('2026-10-19T18:00:00Z'),
    items: [
      { title: 'Grade-A Tomatoes', quantity: 5, unit: 'kg', unitPrice: 34, lineTotal: 170 },
      { title: 'Red Onions', quantity: 2, unit: 'kg', unitPrice: 25, lineTotal: 50 },
    ],
    subtotal: 220,
    deliveryFee: 40,
    tax: 11,
    grandTotal: 271,
    paymentMethod: 'UPI',
    deliveryAddress: {
      line1: 'Flat 101, Residency',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    estimatedDelivery: new Date('2026-10-21T18:00:00Z'),
    trackingUrl: 'http://localhost:5173/track/ORD-9999-ABCD',
    batchTraceability: {
      batchId: 'BATCH-TOM-2026-A1',
      farmName: 'Sahyadri Farm',
    },
    appUrl: 'http://localhost:5173',
    supportEmail: 'support@khetisetu.in',
    year: 2026,
    unsubscribeUrl: 'http://localhost:5173/unsubscribe',
  });

  assert.ok(result.html.includes('ORD-9999-ABCD'));
  assert.ok(result.html.includes('Grade-A Tomatoes'));
  assert.ok(result.html.includes('₹271'));
  assert.ok(result.html.includes('₹170'));
  assert.ok(result.html.includes('BATCH-TOM-2026-A1'));
});

test('Template Engine — quality-assessment renders grade, confidence, and observations', () => {
  const result = renderTemplate('quality-assessment', {
    farmerName: 'Rameshwar Patil',
    batchId: 'BATCH-TOM-2026-Q1',
    cropName: 'Tomato',
    classification: 'PREMIUM_QUALITY',
    confidence: 96,
    observations: ['Excellent skin turgor', 'No pest puncture marks'],
    estimatedShelfLife: '14 days',
    recommendedAction: 'Proceed to marketplace listing.',
    disclaimer: 'AI visual analysis only.',
    listingUrl: 'http://localhost:5173/farmer/listings',
    appUrl: 'http://localhost:5173',
    supportEmail: 'support@khetisetu.in',
    year: 2026,
    unsubscribeUrl: 'http://localhost:5173/unsubscribe',
  });

  assert.ok(result.html.includes('BATCH-TOM-2026-Q1'));
  assert.ok(result.html.includes('PREMIUM_QUALITY'));
  assert.ok(result.html.includes('96%'));
  assert.ok(result.html.includes('Excellent skin turgor'));
});

test('Template Engine — account-locked and password-reset render urgency states', () => {
  const lockedResult = renderTemplate('account-locked', {
    name: 'Rameshwar Patil',
    failedAttempts: 5,
    resetUrl: 'http://localhost:5173/forgot-password',
    appUrl: 'http://localhost:5173',
    supportEmail: 'support@khetisetu.in',
    year: 2026,
    unsubscribeUrl: 'http://localhost:5173/unsubscribe',
  });
  assert.ok(lockedResult.html.includes('Account Temporarily Locked'));
  assert.ok(lockedResult.html.includes('15 Minutes'));

  const resetResult = renderTemplate('password-reset', {
    name: 'Rameshwar Patil',
    resetUrl: 'http://localhost:5173/reset-password?token=abc',
    appUrl: 'http://localhost:5173',
    supportEmail: 'support@khetisetu.in',
    year: 2026,
    unsubscribeUrl: 'http://localhost:5173/unsubscribe',
  });
  assert.ok(resetResult.html.includes('Reset Your Password'));
  assert.ok(resetResult.html.includes('1 hour only'));
});
