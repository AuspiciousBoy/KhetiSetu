const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/tokens');
const logger = require('../utils/logger');

/**
 * Seed or update the administrative account idempotently.
 * Running this multiple times will never create duplicate accounts.
 */
const seedAdmin = async () => {
  logger.info('Connecting to MongoDB for admin account provisioning...');
  await connectDB();

  const email = 'admin@khetisetu.demo';
  const plainPassword = 'admin123';

  // Securely hash password using project's Argon2id mechanism
  const passwordHash = await hashPassword(plainPassword);

  // Idempotent upsert by email
  const adminUser = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        email: email.toLowerCase(),
        passwordHash,
        fullName: 'Super Administrator',
        phone: '+919876543213',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  logger.info(`[SEED] Admin account provisioned idempotently: ${adminUser.email} (Role: ${adminUser.role})`);
  return adminUser;
};

if (require.main === module) {
  seedAdmin()
    .then(async (user) => {
      console.log(`[OK] Admin account active: ${user.email} (ID: ${user._id})`);
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[ERROR] Failed to seed admin account:', err.message);
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = { seedAdmin };
