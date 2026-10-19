const farmerService = require('../services/farmerService');
const { success, paginated, error } = require('../utils/response');

const getProfile = async (req, res, next) => {
  try {
    const profile = await farmerService.getProfile(req.user.id);
    return success(res, profile);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await farmerService.updateProfile(req.user.id, req.body, req);
    return success(res, profile, 'Farmer profile updated successfully');
  } catch (err) {
    next(err);
  }
};

const createBatch = async (req, res, next) => {
  try {
    const batch = await farmerService.createBatch(req.user.id, req.body, req);
    return success(res, batch, 'Produce batch created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getBatches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await farmerService.getMyBatches(req.user.id, {
      page: Number(page),
      limit: Number(limit),
      status,
    });
    return paginated(res, result.batches, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
};

const getBatchById = async (req, res, next) => {
  try {
    const batch = await farmerService.getBatchById(req.params.id, req.user.id);
    return success(res, batch);
  } catch (err) {
    next(err);
  }
};

const assessQuality = async (req, res, next) => {
  try {
    if (!req.file && !req.savedFile) {
      return error(res, 'Produce image file is required for assessment.', 'IMAGE_REQUIRED', 400);
    }

    const file = req.file;
    const imageBase64 = file ? file.buffer.toString('base64') : '';
    const mimeType = file ? file.mimetype : 'image/jpeg';
    const imagePath = req.savedFile ? req.savedFile.path : '/uploads/default_produce.jpg';

    const result = await farmerService.assessBatchQuality({
      batchId: req.params.id,
      farmerId: req.user.id,
      imageBase64,
      mimeType,
      imagePath,
      req,
    });

    return success(res, result, 'Produce quality assessed successfully');
  } catch (err) {
    next(err);
  }
};

const createListing = async (req, res, next) => {
  try {
    const product = await farmerService.createListing(req.user.id, req.body, req);
    return success(res, product, 'Marketplace listing published successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await farmerService.getFarmerAnalytics(req.user.id);
    return success(res, analytics);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  createBatch,
  getBatches,
  getBatchById,
  assessQuality,
  createListing,
  getAnalytics,
};
