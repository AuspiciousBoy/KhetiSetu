const userService = require('../services/userService');
const { success } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    const data = await userService.getUserProfile(req.user.id);
    return success(res, data, 'User profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await userService.updateUserProfile(req.user.id, req.body, req);
    return success(res, data, 'User profile updated successfully');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const data = await userService.changePassword(req.user.id, req.body, req);
    return success(res, data, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await userService.getAddresses(req.user.id, req.user.role);
    return success(res, addresses, 'Addresses fetched successfully');
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const address = await userService.addAddress(req.user.id, req.user.role, req.body);
    return success(res, address, 'Address added successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const address = await userService.updateAddress(req.user.id, req.user.role, req.params.id, req.body);
    return success(res, address, 'Address updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const result = await userService.deleteAddress(req.user.id, req.user.role, req.params.id);
    return success(res, result, 'Address deleted successfully');
  } catch (err) {
    next(err);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const addresses = await userService.setDefaultAddress(req.user.id, req.user.role, req.params.id);
    return success(res, addresses, 'Default address updated successfully');
  } catch (err) {
    next(err);
  }
};

const getFarmerPayment = async (req, res, next) => {
  try {
    const payment = await userService.getFarmerPayment(req.user.id);
    return success(res, payment, 'Farmer payment settings retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const updateFarmerPayment = async (req, res, next) => {
  try {
    const payment = await userService.updateFarmerPayment(req.user.id, req.body, req);
    return success(res, payment, 'Farmer payment settings updated successfully');
  } catch (err) {
    next(err);
  }
};

const uploadFarmerQr = async (req, res, next) => {
  try {
    if (!req.savedFile?.path) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid image file (JPG, PNG, or WEBP) is required.' },
      });
    }

    const payment = await userService.updateFarmerQrCode(req.user.id, req.savedFile.path, req);
    return success(res, payment, 'Farmer UPI QR code uploaded successfully');
  } catch (err) {
    next(err);
  }
};

const deleteFarmerQr = async (req, res, next) => {
  try {
    const payment = await userService.deleteFarmerQrCode(req.user.id, req);
    return success(res, payment, 'Farmer UPI QR code removed successfully');
  } catch (err) {
    next(err);
  }
};

const updateFarmerLocation = async (req, res, next) => {
  try {
    const location = await userService.updateFarmerLocation(req.user.id, req.body, req);
    return success(res, location, 'Farm location updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getFarmerPayment,
  updateFarmerPayment,
  uploadFarmerQr,
  deleteFarmerQr,
  updateFarmerLocation,
};
