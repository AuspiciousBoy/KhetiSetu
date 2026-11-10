const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

process.env.NODE_PATH = path.resolve(__dirname, '../server/node_modules');
require('module').Module._initPaths();

const {
  registerSchema,
  loginSchema,
} = require('../server/validators/authValidators');
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  verifyAccessToken,
} = require('../server/utils/tokens');
const authorize = require('../server/middleware/authorize');

test('KhetiSetu Auth & GSTIN Flow Test Suite', async (t) => {
  await t.test('1. GSTIN Compulsory Validation on Business Registration', async () => {
    // Missing GSTIN on BUSINESS
    await assert.rejects(
      async () => {
        await registerSchema.parseAsync({
          email: 'b2b@agrocorp.com',
          password: 'StrongPassword123!',
          fullName: 'B2B Procurement Manager',
          role: 'BUSINESS',
          profileData: {
            businessName: 'AgroCorp Pvt Ltd',
          },
        });
      },
      (err) => {
        const issues = err.issues || [];
        const hasGstError = issues.some(
          (i) => i.message.includes('GSTIN is compulsory')
        );
        assert.ok(hasGstError, 'Missing GSTIN must be rejected with compulsory message');
        return true;
      }
    );

    // Invalid GSTIN format on BUSINESS
    await assert.rejects(
      async () => {
        await registerSchema.parseAsync({
          email: 'b2b@agrocorp.com',
          password: 'StrongPassword123!',
          fullName: 'B2B Procurement Manager',
          role: 'BUSINESS',
          profileData: {
            businessName: 'AgroCorp Pvt Ltd',
            gstNumber: 'INVALID_GST_123',
          },
        });
      },
      (err) => {
        const issues = err.issues || [];
        const hasFormatError = issues.some(
          (i) => i.message.includes('Invalid GSTIN format')
        );
        assert.ok(hasFormatError, 'Invalid GSTIN must be rejected with format error');
        return true;
      }
    );

    // Valid GSTIN on BUSINESS
    const validBusiness = await registerSchema.parseAsync({
      email: 'b2b@agrocorp.com',
      password: 'StrongPassword123!',
      fullName: 'B2B Procurement Manager',
      role: 'BUSINESS',
      profileData: {
        businessName: 'AgroCorp Pvt Ltd',
        gstNumber: '27AAPFU0939F1ZV',
      },
    });
    assert.equal(validBusiness.role, 'BUSINESS');
    assert.equal(validBusiness.profileData.gstNumber, '27AAPFU0939F1ZV');
  });

  await t.test('2. Non-Business Roles Do NOT Require GSTIN', async () => {
    // Farmer without GSTIN
    const farmer = await registerSchema.parseAsync({
      email: 'ramesh.farmer@khetisetu.demo',
      password: 'StrongPassword123!',
      fullName: 'Ramesh Patil',
      role: 'FARMER',
      profileData: {
        farmName: 'Sahyadri Farm',
        district: 'Pune',
        state: 'Maharashtra',
      },
    });
    assert.equal(farmer.role, 'FARMER');

    // Consumer without GSTIN
    const consumer = await registerSchema.parseAsync({
      email: 'pooja.consumer@khetisetu.demo',
      password: 'StrongPassword123!',
      fullName: 'Pooja Sharma',
      role: 'CONSUMER',
    });
    assert.equal(consumer.role, 'CONSUMER');
  });

  await t.test('3. Admin Password Hashing & Verification (admin123)', async () => {
    const rawAdminPass = 'admin123';
    const hash = await hashPassword(rawAdminPass);

    assert.ok(hash.startsWith('$argon2id$'), 'Admin password must be hashed with Argon2id');
    assert.notEqual(hash, rawAdminPass, 'Plaintext password must never be stored');

    const isValid = await verifyPassword(hash, rawAdminPass);
    assert.equal(isValid, true, 'admin123 must verify against hashed credential');

    const isInvalid = await verifyPassword(hash, 'wrongadminpass');
    assert.equal(isInvalid, false, 'Incorrect password must be rejected');
  });

  await t.test('4. Admin Authorization & Role Escalation Shielding', async () => {
    const adminToken = generateAccessToken({
      id: 'admin_123456789012345678901234',
      email: 'admin@khetisetu.demo',
      role: 'ADMIN',
    });

    const decoded = verifyAccessToken(adminToken);
    assert.equal(decoded.role, 'ADMIN', 'Token must contain ADMIN role claim');

    // Test authorize('ADMIN') middleware with admin user
    let nextCalled = false;
    const adminReq = { user: { id: decoded.id, role: decoded.role } };
    const res = {
      status: (code) => ({
        json: (payload) => ({ code, payload }),
      }),
    };

    const adminGuard = authorize('ADMIN');
    adminGuard(adminReq, res, () => {
      nextCalled = true;
    });
    assert.ok(nextCalled, 'Admin user must be granted access by authorize middleware');

    // Test non-admin user (FARMER / CONSUMER / BUSINESS) accessing admin route
    let forbiddenCode = null;
    let forbiddenPayload = null;
    const farmerReq = { user: { id: 'farmer_123', role: 'FARMER' } };
    const mockRes = {
      status: (code) => {
        forbiddenCode = code;
        return {
          json: (payload) => {
            forbiddenPayload = payload;
          },
        };
      },
    };

    adminGuard(farmerReq, mockRes, () => {
      assert.fail('Non-admin user should not reach next()');
    });

    assert.equal(forbiddenCode, 403, 'Unauthorized role must be rejected with HTTP 403');
    assert.equal(forbiddenPayload.success, false);
    assert.equal(forbiddenPayload.error.code, 'FORBIDDEN');
  });

  await t.test('5. Login Schema Accepts Admin Credentials', async () => {
    const validLogin = await loginSchema.parseAsync({
      email: 'admin@khetisetu.demo',
      password: 'admin123',
    });
    assert.equal(validLogin.email, 'admin@khetisetu.demo');
    assert.equal(validLogin.password, 'admin123');

    // Reject missing password
    await assert.rejects(
      async () => {
        await loginSchema.parseAsync({
          email: 'admin@khetisetu.demo',
          password: '',
        });
      },
      /Password is required/
    );
  });
});
