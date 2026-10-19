const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeObject } = require('../../server/security/mongoSanitizer');
const { validateMagicBytes } = require('../../server/security/fileValidator');
const { calculatePredictedPrice } = require('../../server/services/marketService');

test('KhetiSetu Security Test Suite: NoSQL Injection, Magic Bytes & WMA Math', async (t) => {
  await t.test('1. NoSQL Injection Stripper: Strips $ operators and field manipulation keys', () => {
    const maliciousPayload = {
      email: { $gt: '' },
      password: 'somepassword',
      $where: 'sleep(5000)',
      'nested.injection': 'evil',
      validField: 'cleanValue',
    };

    const sanitized = sanitizeObject(maliciousPayload);

    assert.equal(sanitized.$where, undefined, 'Operators starting with $ must be stripped');
    assert.equal(sanitized['nested.injection'], undefined, 'Dot-notation injection keys must be stripped');
    assert.deepEqual(sanitized.email, {}, '$gt sub-operator must be stripped');
    assert.equal(sanitized.validField, 'cleanValue', 'Legitimate alphanumeric fields must be preserved');
  });

  await t.test('2. File Signature (Magic Bytes) Verification: Rejects malicious executable disguised as JPG', () => {
    // PHP shell script disguised as image
    const fakeJpgBuffer = Buffer.from('<?php echo system($_GET["cmd"]); ?>');
    const detectedFormat = validateMagicBytes(fakeJpgBuffer);

    assert.equal(detectedFormat, false, 'PHP payload disguised as JPG must be rejected by magic bytes inspection');

    // Valid JPEG binary signature (FF D8 FF)
    const validJpgHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validDetected = validateMagicBytes(validJpgHeader);
    assert.equal(validDetected, 'jpg', 'Real JPEG buffer with magic bytes FF D8 FF must pass inspection');
  });

  await t.test('3. Mathematical WMA Predictor: Computes deterministic prediction without LLM hallucination', () => {
    const historicalSeries = [
      { pricePerKg: 30, date: new Date(Date.now() - 3 * 86400000) },
      { pricePerKg: 32, date: new Date(Date.now() - 2 * 86400000) },
      { pricePerKg: 36, date: new Date(Date.now() - 1 * 86400000) },
    ];

    const predicted = calculatePredictedPrice(historicalSeries);

    assert.ok(typeof predicted === 'number', 'Predicted price must be numeric');
    assert.ok(!isNaN(predicted), 'Predicted price must not be NaN');
    assert.ok(predicted >= 30 && predicted <= 45, 'Prediction must align with weighted mathematical series');
  });
});
