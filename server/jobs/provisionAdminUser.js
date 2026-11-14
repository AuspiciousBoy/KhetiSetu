const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/tokens');
const logger = require('../utils/logger');

const provisionAdminUser = async () => {
  logger.info('Connecting to MongoDB to provision admin user...');
  await connectDB();

  const emails = ['shubhtiawri123@gmail.com', 'shubhtiwari123@gmail.com'];
  const password = 'Admin123';
  const passwordHash = await hashPassword(password);

  for (const email of emails) {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          email: email.toLowerCase(),
          passwordHash,
          fullName: 'Shubh Tiwari',
          phone: '+919876543210',
          role: 'ADMIN',
          isEmailVerified: true,
          isActive: true,
          failedLoginAttempts: 0,
          lockUntil: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[OK] Provisioned Admin: ${user.email} (ID: ${user._id}, Role: ${user.role})`);
  }

  await disconnectDB();
};

provisionAdminUser()
  .then(() => {
    console.log('[SUCCESS] All requested admin accounts provisioned successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[ERROR] Failed to provision admin:', err.message);
    process.exit(1);
  });
