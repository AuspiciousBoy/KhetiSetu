const User = require('../models/User');
const ConsumerProfile = require('../models/ConsumerProfile');
const BusinessProfile = require('../models/BusinessProfile');
const FarmerProfile = require('../models/FarmerProfile');
const { hashPassword, verifyPassword } = require('../utils/tokens');
const { ApiError } = require('../utils/response');
const { logAuditEvent } = require('../middleware/auditLogger');
const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../config/env');

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9.\-_]{2,64}$/;

/**
 * Fetch authoritative user profile with role-specific document
 */
const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.', 'NOT_FOUND');
  }

  let profile = null;
  switch (user.role) {
    case 'CONSUMER':
      profile = await ConsumerProfile.findOne({ userId: user._id });
      if (!profile) {
        profile = await ConsumerProfile.create({ userId: user._id, addresses: [] });
      }
      break;
    case 'BUSINESS':
      profile = await BusinessProfile.findOne({ userId: user._id });
      if (!profile) {
        profile = await BusinessProfile.create({
          userId: user._id,
          businessName: user.fullName ? `${user.fullName}'s Business` : 'Agro Enterprise',
          gstNumber: '27AAAAA0000A1Z5',
          deliveryAddresses: [],
        });
      }
      break;
    case 'FARMER':
      profile = await FarmerProfile.findOne({ userId: user._id });
      if (!profile) {
        profile = await FarmerProfile.create({
          userId: user._id,
          farmName: 'My Farm',
          location: { state: 'Maharashtra', district: 'Pune' },
        });
      }
      break;
    default:
      profile = {};
  }

  return {
    user: user.toPublicJSON(),
    profile,
  };
};

/**
 * Update personal and role-specific profile details
 */
const updateUserProfile = async (userId, updateData, req) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.', 'NOT_FOUND');
  }

  // Update Common User fields
  if (updateData.fullName) user.fullName = updateData.fullName.trim();
  if (updateData.phone !== undefined) user.phone = updateData.phone.trim();
  await user.save();

  // Update role-specific profile fields
  let profile = null;
  if (user.role === 'CONSUMER') {
    profile = await ConsumerProfile.findOne({ userId });
    if (updateData.preferences) {
      if (!profile) profile = new ConsumerProfile({ userId });
      profile.preferences = { ...profile.preferences, ...updateData.preferences };
      await profile.save();
    }
  } else if (user.role === 'BUSINESS') {
    profile = await BusinessProfile.findOne({ userId });
    const hasBusinessUpdates =
      updateData.businessName ||
      updateData.contactPerson ||
      updateData.businessType ||
      updateData.gstNumber ||
      updateData.billingInformation;

    if (hasBusinessUpdates) {
      if (!profile) {
        profile = new BusinessProfile({
          userId,
          businessName: updateData.businessName ? updateData.businessName.trim() : `${user.fullName} Enterprises`,
          contactPerson: updateData.contactPerson ? updateData.contactPerson.trim() : user.fullName,
          businessType: updateData.businessType || 'RETAILER',
        });
      }
      if (updateData.businessName) profile.businessName = updateData.businessName.trim();
      if (updateData.contactPerson) profile.contactPerson = updateData.contactPerson.trim();
      if (updateData.businessType) profile.businessType = updateData.businessType;
      if (updateData.gstNumber) profile.gstNumber = updateData.gstNumber.trim().toUpperCase();
      if (updateData.billingInformation) {
        profile.billingInformation = { ...profile.billingInformation, ...updateData.billingInformation };
      }
      await profile.save();
    }
  } else if (user.role === 'FARMER') {
    profile = await FarmerProfile.findOne({ userId });
    const hasFarmerUpdates =
      updateData.farmName ||
      updateData.landSizeAcres !== undefined ||
      updateData.soilType ||
      updateData.cropsGrown ||
      updateData.bio !== undefined ||
      updateData.location;

    if (hasFarmerUpdates) {
      if (!profile) {
        profile = new FarmerProfile({
          userId,
          farmName: updateData.farmName ? updateData.farmName.trim() : `${user.fullName}'s Farm`,
          location: {
            state: updateData.location?.state || 'Maharashtra',
            district: updateData.location?.district || 'General',
            ...updateData.location,
          },
        });
      }
      if (updateData.farmName) profile.farmName = updateData.farmName.trim();
      if (updateData.landSizeAcres !== undefined) profile.landSizeAcres = Number(updateData.landSizeAcres);
      if (updateData.soilType) profile.soilType = updateData.soilType;
      if (updateData.cropsGrown) profile.cropsGrown = updateData.cropsGrown;
      if (updateData.bio !== undefined) profile.bio = updateData.bio;
      if (updateData.location) {
        profile.location = { ...profile.location, ...updateData.location };
      }
      await profile.save();
    }
  }

  await logAuditEvent({
    req,
    actorId: userId,
    actorRole: user.role,
    action: 'USER_PROFILE_UPDATED',
    resource: 'User',
    resourceId: userId,
    result: 'SUCCESS',
  });

  return {
    user: user.toPublicJSON(),
    profile,
  };
};

/**
 * Change password with Argon2 verification
 */
const changePassword = async (userId, { currentPassword, newPassword }, req) => {
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Both current and new passwords are required.', 'VALIDATION_ERROR');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters long.', 'WEAK_PASSWORD');
  }

  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new ApiError(404, 'User not found.', 'NOT_FOUND');
  }

  const isMatch = await verifyPassword(user.passwordHash, currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect.', 'INVALID_CREDENTIALS');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await logAuditEvent({
    req,
    actorId: userId,
    actorRole: user.role,
    action: 'PASSWORD_CHANGED',
    resource: 'User',
    resourceId: userId,
    result: 'SUCCESS',
  });

  return { message: 'Password updated successfully.' };
};

/**
 * Address Management: Fetch all addresses for Consumer or Business
 */
const getAddresses = async (userId, role) => {
  if (role === 'CONSUMER') {
    const profile = await ConsumerProfile.findOne({ userId });
    return profile?.addresses || [];
  } else if (role === 'BUSINESS') {
    const profile = await BusinessProfile.findOne({ userId });
    return profile?.deliveryAddresses || [];
  } else if (role === 'FARMER') {
    const profile = await FarmerProfile.findOne({ userId });
    if (!profile) return [];
    return [
      {
        _id: profile._id,
        label: 'Farm Gate',
        line1: profile.location?.farmAddress || profile.location?.village || 'Farm Location',
        city: profile.location?.city || profile.location?.district || '',
        district: profile.location?.district || '',
        state: profile.location?.state || '',
        pincode: profile.location?.pincode || '',
        isDefault: true,
      },
    ];
  }
  return [];
};

/**
 * Add a new saved address
 */
const addAddress = async (userId, role, addressData) => {
  if (!addressData.line1 || !addressData.city || !addressData.state || !addressData.pincode) {
    throw new ApiError(400, 'Address line 1, city, state and PIN code are required.', 'VALIDATION_ERROR');
  }

  if (role === 'BUSINESS') {
    let profile = await BusinessProfile.findOne({ userId });
    if (!profile) {
      profile = await BusinessProfile.create({
        userId,
        businessName: 'Business Entity',
        gstNumber: '27AAAAA0000A1Z5',
        deliveryAddresses: [],
      });
    }

    const isFirst = profile.deliveryAddresses.length === 0;
    const shouldBeDefault = Boolean(addressData.isDefault || isFirst);

    if (shouldBeDefault) {
      profile.deliveryAddresses.forEach((a) => (a.isDefault = false));
    }

    profile.deliveryAddresses.push({
      label: addressData.label || 'Warehouse',
      warehouseName: addressData.warehouseName || addressData.label || 'Central Warehouse',
      companyName: addressData.companyName,
      contactPerson: addressData.contactPerson,
      contactNumber: addressData.contactNumber,
      houseNo: addressData.houseNo,
      streetArea: addressData.streetArea,
      line1: addressData.line1.trim(),
      line2: addressData.line2?.trim(),
      city: addressData.city.trim(),
      district: addressData.district?.trim(),
      state: addressData.state.trim(),
      pincode: addressData.pincode.trim(),
      landmark: addressData.landmark?.trim(),
      isDefault: shouldBeDefault,
    });

    await profile.save();
    return profile.deliveryAddresses[profile.deliveryAddresses.length - 1];
  } else {
    // Default to CONSUMER
    let profile = await ConsumerProfile.findOne({ userId });
    if (!profile) {
      profile = await ConsumerProfile.create({ userId, addresses: [] });
    }

    const isFirst = profile.addresses.length === 0;
    const shouldBeDefault = Boolean(addressData.isDefault || isFirst);

    if (shouldBeDefault) {
      profile.addresses.forEach((a) => (a.isDefault = false));
    }

    profile.addresses.push({
      label: addressData.label || 'Home',
      title: addressData.title || addressData.label || 'Home',
      fullName: addressData.fullName,
      contactNumber: addressData.contactNumber,
      houseNo: addressData.houseNo,
      streetArea: addressData.streetArea,
      line1: addressData.line1.trim(),
      line2: addressData.line2?.trim(),
      city: addressData.city.trim(),
      district: addressData.district?.trim(),
      state: addressData.state.trim(),
      pincode: addressData.pincode.trim(),
      landmark: addressData.landmark?.trim(),
      isDefault: shouldBeDefault,
    });

    await profile.save();
    return profile.addresses[profile.addresses.length - 1];
  }
};

/**
 * Update an existing saved address
 */
const updateAddress = async (userId, role, addressId, addressData) => {
  if (role === 'BUSINESS') {
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) throw new ApiError(404, 'Business profile not found.', 'NOT_FOUND');

    const address = profile.deliveryAddresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found.', 'NOT_FOUND');

    if (addressData.isDefault) {
      profile.deliveryAddresses.forEach((a) => (a.isDefault = false));
      address.isDefault = true;
    }

    if (addressData.label) address.label = addressData.label;
    if (addressData.companyName !== undefined) address.companyName = addressData.companyName;
    if (addressData.contactPerson !== undefined) address.contactPerson = addressData.contactPerson;
    if (addressData.contactNumber !== undefined) address.contactNumber = addressData.contactNumber;
    if (addressData.houseNo !== undefined) address.houseNo = addressData.houseNo;
    if (addressData.streetArea !== undefined) address.streetArea = addressData.streetArea;
    if (addressData.line1) address.line1 = addressData.line1.trim();
    if (addressData.line2 !== undefined) address.line2 = addressData.line2.trim();
    if (addressData.city) address.city = addressData.city.trim();
    if (addressData.district !== undefined) address.district = addressData.district.trim();
    if (addressData.state) address.state = addressData.state.trim();
    if (addressData.pincode) address.pincode = addressData.pincode.trim();
    if (addressData.landmark !== undefined) address.landmark = addressData.landmark.trim();

    await profile.save();
    return address;
  } else {
    const profile = await ConsumerProfile.findOne({ userId });
    if (!profile) throw new ApiError(404, 'Consumer profile not found.', 'NOT_FOUND');

    const address = profile.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found.', 'NOT_FOUND');

    if (addressData.isDefault) {
      profile.addresses.forEach((a) => (a.isDefault = false));
      address.isDefault = true;
    }

    if (addressData.label) address.label = addressData.label;
    if (addressData.fullName !== undefined) address.fullName = addressData.fullName;
    if (addressData.contactNumber !== undefined) address.contactNumber = addressData.contactNumber;
    if (addressData.houseNo !== undefined) address.houseNo = addressData.houseNo;
    if (addressData.streetArea !== undefined) address.streetArea = addressData.streetArea;
    if (addressData.line1) address.line1 = addressData.line1.trim();
    if (addressData.line2 !== undefined) address.line2 = addressData.line2.trim();
    if (addressData.city) address.city = addressData.city.trim();
    if (addressData.district !== undefined) address.district = addressData.district.trim();
    if (addressData.state) address.state = addressData.state.trim();
    if (addressData.pincode) address.pincode = addressData.pincode.trim();
    if (addressData.landmark !== undefined) address.landmark = addressData.landmark.trim();

    await profile.save();
    return address;
  }
};

/**
 * Delete a saved address
 */
const deleteAddress = async (userId, role, addressId) => {
  if (role === 'BUSINESS') {
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) throw new ApiError(404, 'Profile not found.', 'NOT_FOUND');

    const address = profile.deliveryAddresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found.', 'NOT_FOUND');

    const wasDefault = address.isDefault;
    profile.deliveryAddresses.pull(addressId);

    if (wasDefault && profile.deliveryAddresses.length > 0) {
      profile.deliveryAddresses[0].isDefault = true;
    }

    await profile.save();
    return { success: true, message: 'Address removed successfully.' };
  } else {
    const profile = await ConsumerProfile.findOne({ userId });
    if (!profile) throw new ApiError(404, 'Profile not found.', 'NOT_FOUND');

    const address = profile.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found.', 'NOT_FOUND');

    const wasDefault = address.isDefault;
    profile.addresses.pull(addressId);

    if (wasDefault && profile.addresses.length > 0) {
      profile.addresses[0].isDefault = true;
    }

    await profile.save();
    return { success: true, message: 'Address removed successfully.' };
  }
};

/**
 * Set an address as default
 */
const setDefaultAddress = async (userId, role, addressId) => {
  if (role === 'BUSINESS') {
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) throw new ApiError(404, 'Profile not found.', 'NOT_FOUND');

    let matched = false;
    profile.deliveryAddresses.forEach((a) => {
      if (a._id.toString() === addressId.toString()) {
        a.isDefault = true;
        matched = true;
      } else {
        a.isDefault = false;
      }
    });

    if (!matched) throw new ApiError(404, 'Address not found.', 'NOT_FOUND');
    await profile.save();
    return profile.deliveryAddresses;
  } else {
    const profile = await ConsumerProfile.findOne({ userId });
    if (!profile) throw new ApiError(404, 'Profile not found.', 'NOT_FOUND');

    let matched = false;
    profile.addresses.forEach((a) => {
      if (a._id.toString() === addressId.toString()) {
        a.isDefault = true;
        matched = true;
      } else {
        a.isDefault = false;
      }
    });

    if (!matched) throw new ApiError(404, 'Address not found.', 'NOT_FOUND');
    await profile.save();
    return profile.addresses;
  }
};

/**
 * Helper to ensure a FarmerProfile exists for a farmer user
 */
const getOrCreateFarmerProfile = async (farmerId) => {
  let profile = await FarmerProfile.findOne({ userId: farmerId });
  if (!profile) {
    const user = await User.findById(farmerId);
    profile = await FarmerProfile.create({
      userId: farmerId,
      farmName: user?.fullName ? `${user.fullName}'s Farm` : 'My Farm',
      location: { state: 'Maharashtra', district: 'General' },
    });
  }
  return profile;
};

/**
 * Farmer UPI Payment Settings
 */
const getFarmerPayment = async (farmerId) => {
  const profile = await getOrCreateFarmerProfile(farmerId);

  return (
    profile.paymentSettings || {
      upiId: '',
      upiQrCodeUrl: '',
      accountHolderName: '',
      isConfigured: false,
    }
  );
};

const updateFarmerPayment = async (farmerId, { upiId, accountHolderName }, req) => {
  if (!upiId || !UPI_REGEX.test(upiId.trim())) {
    throw new ApiError(
      400,
      'Invalid UPI ID format. Valid format example: farmer@upi or name@okaxis',
      'INVALID_UPI_ID'
    );
  }

  const profile = await getOrCreateFarmerProfile(farmerId);

  profile.paymentSettings = {
    ...profile.paymentSettings,
    upiId: upiId.trim(),
    accountHolderName: accountHolderName ? accountHolderName.trim() : profile.paymentSettings?.accountHolderName,
    isConfigured: true,
    updatedAt: new Date(),
  };

  await profile.save();

  await logAuditEvent({
    req,
    actorId: farmerId,
    actorRole: 'FARMER',
    action: 'FARMER_PAYMENT_CONFIGURED',
    resource: 'FarmerProfile',
    resourceId: profile._id,
    result: 'SUCCESS',
    metadata: { upiId: upiId.trim() },
  });

  return profile.paymentSettings;
};

const updateFarmerQrCode = async (farmerId, qrFilePath, req) => {
  const profile = await getOrCreateFarmerProfile(farmerId);

  // Remove old QR image file if it existed
  if (profile.paymentSettings?.upiQrCodeUrl && profile.paymentSettings.upiQrCodeUrl.startsWith('/uploads/')) {
    const oldPath = path.join(UPLOAD_DIR, path.basename(profile.paymentSettings.upiQrCodeUrl));
    fs.promises.unlink(oldPath).catch(() => {});
  }

  profile.paymentSettings = {
    ...profile.paymentSettings,
    upiQrCodeUrl: qrFilePath,
    isConfigured: Boolean(profile.paymentSettings?.upiId || qrFilePath),
    updatedAt: new Date(),
  };

  await profile.save();

  await logAuditEvent({
    req,
    actorId: farmerId,
    actorRole: 'FARMER',
    action: 'FARMER_QR_CODE_UPLOADED',
    resource: 'FarmerProfile',
    resourceId: profile._id,
    result: 'SUCCESS',
  });

  return profile.paymentSettings;
};

const deleteFarmerQrCode = async (farmerId, req) => {
  const profile = await getOrCreateFarmerProfile(farmerId);

  if (profile.paymentSettings?.upiQrCodeUrl && profile.paymentSettings.upiQrCodeUrl.startsWith('/uploads/')) {
    const oldPath = path.join(UPLOAD_DIR, path.basename(profile.paymentSettings.upiQrCodeUrl));
    fs.promises.unlink(oldPath).catch(() => {});
  }

  profile.paymentSettings.upiQrCodeUrl = '';
  profile.paymentSettings.updatedAt = new Date();
  await profile.save();

  await logAuditEvent({
    req,
    actorId: farmerId,
    actorRole: 'FARMER',
    action: 'FARMER_QR_CODE_REMOVED',
    resource: 'FarmerProfile',
    resourceId: profile._id,
    result: 'SUCCESS',
  });

  return profile.paymentSettings;
};

const updateFarmerLocation = async (farmerId, locationData, req) => {
  const profile = await getOrCreateFarmerProfile(farmerId);

  profile.location = {
    ...profile.location,
    farmAddress: locationData.farmAddress !== undefined ? locationData.farmAddress.trim() : profile.location.farmAddress,
    village: locationData.village !== undefined ? locationData.village.trim() : profile.location.village,
    city: locationData.city !== undefined ? locationData.city.trim() : profile.location.city,
    district: locationData.district !== undefined ? locationData.district.trim() : profile.location.district,
    state: locationData.state !== undefined ? locationData.state.trim() : profile.location.state,
    pincode: locationData.pincode !== undefined ? locationData.pincode.trim() : profile.location.pincode,
    landmark: locationData.landmark !== undefined ? locationData.landmark.trim() : profile.location.landmark,
    coordinates: locationData.coordinates || profile.location.coordinates,
  };

  await profile.save();

  await logAuditEvent({
    req,
    actorId: farmerId,
    actorRole: 'FARMER',
    action: 'FARMER_LOCATION_UPDATED',
    resource: 'FarmerProfile',
    resourceId: profile._id,
    result: 'SUCCESS',
  });

  return profile.location;
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getFarmerPayment,
  updateFarmerPayment,
  updateFarmerQrCode,
  deleteFarmerQrCode,
  updateFarmerLocation,
};
