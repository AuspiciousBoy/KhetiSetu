const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../../server/config/db');
const User = require('../../server/models/User');
const authService = require('../../server/services/authService');
const { hashPassword, verifyPassword } = require('../../server/utils/tokens');

test('KhetiSetu Security Test Suite: Authentication, Password Hashing & RBAC', async (t) => {
  await connectDB();

  await t.test('1. Argon2id Password Hashing: Hashes passwords with memory & time hardness', async () => {
    const rawPassword = 'StrongFarmerPassword@2026!';
    const hash = await hashPassword(rawPassword);

    assert.ok(hash.startsWith('$argon2id$'), 'Hash must use Argon2id variant');
    assert.notEqual(hash, rawPassword, 'Plaintext password must never be stored');

    const isValid = await verifyPassword(hash, rawPassword);
    assert.equal(isValid, true, 'Valid password must verify against hash');

    const isInvalid = await verifyPassword(hash, 'WrongPassword123!');
    assert.equal(isInvalid, false, 'Invalid password must be rejected');
  });

  await t.test('2. Role Escalation Prevention: User cannot register as ADMIN publicly', async () => {
    const testEmail = `attacker_${Date.now()}@test.com`;

    const result = await authService.register({
      email: testEmail,
      password: 'HackerPassword@2026!',
      fullName: 'Attacker Attempting Escalation',
      role: 'ADMIN', // Malicious attempt to register as ADMIN
      req: { ip: '127.0.0.1' },
    });

    // Cleanup created test user
    await User.deleteOne({ email: testEmail });

    assert.notEqual(
      result.user.role,
      'ADMIN',
      'System MUST NOT permit public self-registration with ADMIN privileges'
    );
    assert.equal(
      result.user.role,
      'CONSUMER',
      'Disallowed roles must safely fall back to lowest privilege (CONSUMER)'
    );
  });

  await t.test('3. Authentication Failure Handling: Wrong password throws authentication error', async () => {
    await User.updateOne(
      { email: 'farmer@khetisetu.demo' },
      { $set: { failedLoginAttempts: 0, lockUntil: null } }
    );

    await assert.rejects(
      async () => {
        await authService.login({
          email: 'farmer@khetisetu.demo',
          password: 'IncorrectPassword999!',
          req: { ip: '127.0.0.1' },
        });
      },
      /Invalid email or password credentials/,
      'Login with incorrect credentials must throw error without leaking user existence'
    );

    await User.updateOne(
      { email: 'farmer@khetisetu.demo' },
      { $set: { failedLoginAttempts: 0, lockUntil: null } }
    );
  });

  await t.test('4. Account Lockout: 5 consecutive failed attempts locks account for 15 minutes', async () => {
    const lockTestEmail = `locktest_${Date.now()}@test.com`;
    await authService.register({
      email: lockTestEmail,
      password: 'StrongUserPassword@2026!',
      fullName: 'Lockout Test User',
      role: 'CONSUMER',
      req: { ip: '127.0.0.1' },
    });

    for (let i = 0; i < 4; i++) {
      try {
        await authService.login({
          email: lockTestEmail,
          password: 'WrongPassword!',
          req: { ip: '127.0.0.1' },
        });
      } catch (err) {
        assert.match(err.message, /Invalid email or password credentials/);
      }
    }

    // 5th attempt must trigger account lockout
    await assert.rejects(
      async () => {
        await authService.login({
          email: lockTestEmail,
          password: 'WrongPassword!',
          req: { ip: '127.0.0.1' },
        });
      },
      /Maximum login attempts exceeded. Account is locked for 15 minutes/,
      '5th failed attempt must trigger 15-minute account lockout'
    );

    await User.deleteOne({ email: lockTestEmail });
  });

  await disconnectDB();
});
