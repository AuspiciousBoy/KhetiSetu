/**
 * KhetiSetu Developer Email Preview Routes
 * ──────────────────────────────────────────
 * Active only in development/test environments.
 * Allows instant visual inspection of all email templates in the browser.
 * URL: GET /api/v1/dev/email-preview/:template
 */

'use strict';

const express = require('express');
const router = express.Router();
const { renderTemplate } = require('../../utils/templateEngine');
const emailConfig = require('../../config/emailConfig');

const MOCK_DATA = {
  'welcome-farmer': {
    farmerName: 'Rameshwar Patil',
    farmName: 'Sahyadri Organic Farm',
    location: { district: 'Pune', state: 'Maharashtra' },
    dashboardUrl: `${emailConfig.appUrl}/farmer/batches`,
  },
  'welcome-consumer': {
    name: 'Pooja Sharma',
    marketplaceUrl: `${emailConfig.appUrl}/marketplace`,
  },
  'welcome-business': {
    contactName: 'Vikram Mehta',
    businessName: 'Kisan Agro Foods Pvt. Ltd.',
    b2bUrl: `${emailConfig.appUrl}/marketplace?mode=b2b`,
  },
  'welcome-admin': {
    name: 'Admin Officer',
    adminUrl: `${emailConfig.appUrl}/admin`,
  },
  'verify-email': {
    name: 'Rameshwar Patil',
    verifyUrl: `${emailConfig.appUrl}/verify-email?token=mock_sample_token_123456`,
  },
  'email-verified': {
    name: 'Rameshwar Patil',
    loginUrl: `${emailConfig.appUrl}/login`,
  },
  'password-reset': {
    name: 'Rameshwar Patil',
    resetUrl: `${emailConfig.appUrl}/reset-password?token=mock_reset_token_123456`,
  },
  'password-changed': {
    name: 'Rameshwar Patil',
    changedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    loginUrl: `${emailConfig.appUrl}/login`,
  },
  'account-locked': {
    name: 'Rameshwar Patil',
    failedAttempts: 5,
    resetUrl: `${emailConfig.appUrl}/forgot-password`,
  },
  'order-placed-buyer': {
    buyerName: 'Pooja Sharma',
    orderId: 'ORD-506472-BE8B',
    orderDate: new Date(),
    items: [
      { title: 'Grade-A Hybrid Tomatoes', quantity: 10, unit: 'kg', unitPrice: 35, lineTotal: 350 },
      { title: 'Fresh Nashik Red Onions', quantity: 5, unit: 'kg', unitPrice: 28, lineTotal: 140 },
    ],
    subtotal: 490,
    deliveryFee: 40,
    tax: 25,
    grandTotal: 555,
    paymentMethod: 'UPI',
    deliveryAddress: {
      line1: 'Flat 402, Green Meadows',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411038',
    },
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    trackingUrl: `${emailConfig.appUrl}/track/ORD-506472-BE8B`,
    batchTraceability: {
      batchId: 'BATCH-TOM-2026-X9F2',
      farmName: 'Sahyadri Organic Farm',
    },
  },
  'order-placed-farmer': {
    farmerName: 'Rameshwar Patil',
    orderId: 'ORD-506472-BE8B',
    items: [
      { title: 'Grade-A Hybrid Tomatoes', quantity: 10, unit: 'kg', unitPrice: 35, lineTotal: 350 },
    ],
    orderTotal: 555,
    buyerDistrict: 'Pune',
    dispatchBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
    orderUrl: `${emailConfig.appUrl}/farmer/orders`,
  },
  'order-packed': {
    buyerName: 'Pooja Sharma',
    orderId: 'ORD-506472-BE8B',
    farmName: 'Sahyadri Organic Farm',
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
    trackingUrl: `${emailConfig.appUrl}/track/ORD-506472-BE8B`,
  },
  'order-dispatched': {
    buyerName: 'Pooja Sharma',
    orderId: 'ORD-506472-BE8B',
    farmName: 'Sahyadri Organic Farm',
    driverName: 'Sanjay Shinde',
    vehicleNumber: 'MH-12-AK-9821',
    trackingUrl: `${emailConfig.appUrl}/track/ORD-506472-BE8B`,
  },
  'order-delivered-buyer': {
    buyerName: 'Pooja Sharma',
    orderId: 'ORD-506472-BE8B',
    farmName: 'Sahyadri Organic Farm',
    items: [
      { title: 'Grade-A Hybrid Tomatoes', quantity: 10, unit: 'kg', unitPrice: 35, lineTotal: 350 },
    ],
    deliveredAt: new Date(),
    reviewUrl: `${emailConfig.appUrl}/consumer/orders`,
  },
  'order-cancelled': {
    buyerName: 'Pooja Sharma',
    orderId: 'ORD-506472-BE8B',
    reason: 'Buyer requested cancellation prior to packing.',
    refundAmount: 555,
    marketplaceUrl: `${emailConfig.appUrl}/marketplace`,
  },
  'batch-registered': {
    farmerName: 'Rameshwar Patil',
    batchId: 'BATCH-TOM-2026-X9F2',
    cropName: 'Tomato',
    quantity: 500,
    unit: 'kg',
    harvestDate: new Date(),
    assessUrl: `${emailConfig.appUrl}/farmer/batches`,
  },
  'quality-assessment': {
    farmerName: 'Rameshwar Patil',
    batchId: 'BATCH-TOM-2026-X9F2',
    cropName: 'Tomato',
    classification: 'PREMIUM_QUALITY',
    confidence: 94,
    observations: [
      'Uniform deep red colouration with healthy epidermal turgor',
      'No visual signs of Early Blight (Alternaria solani) or mechanical bruising',
      'Stem attachment intact indicating recent harvest',
    ],
    estimatedShelfLife: '12-14 days under 12-15°C storage',
    recommendedAction: 'Excellent quality. High market potential for both retail and B2B wholesale listings.',
    disclaimer: 'AI visual analysis only — not certified laboratory testing.',
    listingUrl: `${emailConfig.appUrl}/farmer/listings`,
  },
  'listing-published': {
    farmerName: 'Rameshwar Patil',
    listingTitle: 'Farm Fresh Hybrid Tomatoes (Grade A)',
    pricePerUnit: 35,
    unit: 'kg',
    availableQuantity: 450,
    qualityGrade: 'PREMIUM_QUALITY',
    listingUrl: `${emailConfig.appUrl}/marketplace/sample-id`,
  },
  'low-stock-alert': {
    farmerName: 'Rameshwar Patil',
    listingTitle: 'Farm Fresh Hybrid Tomatoes (Grade A)',
    remainingQuantity: 20,
    originalQuantity: 500,
    unit: 'kg',
    batchesUrl: `${emailConfig.appUrl}/farmer/batches`,
  },
  'admin-alert': {
    alertTitle: 'New FARMER Registered',
    alertMessage: 'A new farmer account has been registered and is ready for onboarding.',
    details: {
      Role: 'FARMER',
      Name: 'Rameshwar Patil',
      Email: 'farmer@khetisetu.demo',
      District: 'Pune',
    },
    adminUrl: `${emailConfig.appUrl}/admin`,
  },
};

/**
 * List all available email templates
 * GET /api/v1/dev/email-preview
 */
router.get('/', (req, res) => {
  const templates = Object.keys(MOCK_DATA);
  const links = templates
    .map(
      (t) =>
        `<li><a href="/api/v1/dev/email-preview/${t}" target="_blank" style="color:#08241a;font-weight:600;text-decoration:none;">${t}</a></li>`
    )
    .join('');

  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>KhetiSetu Email Templates Preview</title></head>
      <body style="font-family:sans-serif;padding:32px;background:#fdf9f0;">
        <h1 style="color:#08241a;">🌾 KhetiSetu Email Template Gallery</h1>
        <p style="color:#5a5a5a;">Click any template to preview its rendered HTML output:</p>
        <ul style="line-height:2.2;font-size:16px;">
          ${links}
        </ul>
      </body>
    </html>
  `);
});

/**
 * Render specific email template
 * GET /api/v1/dev/email-preview/:template
 */
router.get('/:template', (req, res) => {
  const { template } = req.params;
  const mockContext = MOCK_DATA[template];

  if (!mockContext) {
    return res.status(404).send(`<h3>Template "${template}" not found in gallery.</h3><a href="/api/v1/dev/email-preview">Back to Gallery</a>`);
  }

  try {
    const fullContext = {
      ...mockContext,
      appUrl: emailConfig.appUrl,
      supportEmail: emailConfig.replyTo,
      year: new Date().getFullYear(),
      unsubscribeUrl: `${emailConfig.appUrl}/unsubscribe`,
    };
    const { html } = renderTemplate(template, fullContext);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send(`<h3>Render Error: ${err.message}</h3><pre>${err.stack}</pre>`);
  }
});

module.exports = router;
