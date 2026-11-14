const ProduceBatch = require('../models/ProduceBatch');
const Product = require('../models/Product');
const QualityAssessment = require('../models/QualityAssessment');
const FarmerProfile = require('../models/FarmerProfile');
const Order = require('../models/Order');
const Crop = require('../models/Crop');
const User = require('../models/User');
const { assessProduceQuality } = require('./geminiService');
const { logAuditEvent } = require('../middleware/auditLogger');
const crypto = require('crypto');
const { queueEmail } = require('../integrations/emailService');
const emailConfig = require('../config/emailConfig');

/**
 * Get or create farmer profile
 */
const getProfile = async (farmerId) => {
  let profile = await FarmerProfile.findOne({ userId: farmerId });
  if (!profile) {
    profile = await FarmerProfile.create({
      userId: farmerId,
      farmName: 'My Farm',
      location: { state: 'Maharashtra', district: 'Pune' },
    });
  }
  return profile;
};

/**
 * Update farmer profile
 */
const updateProfile = async (farmerId, updateData, req) => {
  const allowed = ['farmName', 'location', 'landSizeAcres', 'soilType', 'cropsGrown', 'bio'];
  const sanitized = {};
  for (const key of allowed) {
    if (updateData[key] !== undefined) {
      sanitized[key] = updateData[key];
    }
  }

  const profile = await FarmerProfile.findOneAndUpdate(
    { userId: farmerId },
    { $set: sanitized },
    { returnDocument: 'after', upsert: true }
  );

  await logAuditEvent({
    req,
    actorId: farmerId,
    action: 'FARMER_PROFILE_UPDATED',
    resource: 'FarmerProfile',
    resourceId: profile._id,
    result: 'SUCCESS',
  });

  return profile;
};

/**
 * Create a new produce batch
 */
const createBatch = async (farmerId, batchData, req) => {
  const farmerProfile = await getProfile(farmerId);
  const crop = await Crop.findOne({ name: new RegExp(`^${batchData.cropName}$`, 'i') });

  // Generate unique batch code: e.g. BATCH-TOM-2026-X9F2
  const shortCrop = (batchData.cropName || 'CRP').substring(0, 3).toUpperCase();
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const batchId = `BATCH-${shortCrop}-${new Date().getFullYear()}-${randomSuffix}`;

  const batch = await ProduceBatch.create({
    batchId,
    farmerId,
    cropId: crop ? crop._id : undefined,
    cropName: batchData.cropName,
    quantity: batchData.quantity,
    availableQuantity: batchData.quantity,
    unit: batchData.unit || 'kg',
    harvestDate: batchData.harvestDate || new Date(),
    storageInformation: batchData.storageInformation || {
      method: 'Ventilated Farm Storage',
      location: 'Primary Barn',
    },
    shelfLifeDays: batchData.shelfLifeDays || (crop?.typicalShelfLifeDays || 10),
    originLocation: {
      state: farmerProfile.location.state,
      district: farmerProfile.location.district,
      village: farmerProfile.location.village || '',
    },
    notes: batchData.notes,
  });

  await logAuditEvent({
    req,
    actorId: farmerId,
    action: 'PRODUCE_BATCH_CREATED',
    resource: 'ProduceBatch',
    resourceId: batch._id,
    result: 'SUCCESS',
    metadata: { batchId, cropName: batch.cropName, quantity: batch.quantity },
  });

  // Asynchronously dispatch harvest batch registration confirmation
  setImmediate(async () => {
    try {
      const user = await User.findById(farmerId).select('email fullName emailPreferences');
      if (user && user.email) {
        queueEmail({
          to: user.email,
          template: 'batch-registered',
          subject: `Harvest Batch Registered — ${batch.batchId} — KhetiSetu`,
          context: {
            farmerName: user.fullName || 'Farmer Partner',
            batchId: batch.batchId,
            cropName: batch.cropName,
            quantity: batch.quantity,
            unit: batch.unit,
            harvestDate: batch.harvestDate,
            assessUrl: `${emailConfig.appUrl}/farmer/batches`,
          },
          user,
        });
      }
    } catch (err) {}
  });

  return batch;
};

/**
 * List batches belonging to farmer
 */
const getMyBatches = async (farmerId, { page = 1, limit = 20, status }) => {
  const query = { farmerId };
  if (status) {
    query.listingStatus = status;
  }

  const skip = (page - 1) * limit;
  const [batches, total] = await Promise.all([
    ProduceBatch.find(query)
      .populate('qualityAssessmentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ProduceBatch.countDocuments(query),
  ]);

  return { batches, total, page, limit };
};

/**
 * Get batch details with ownership check
 */
const getBatchById = async (batchId, farmerId) => {
  const batch = await ProduceBatch.findOne({ _id: batchId, farmerId }).populate('qualityAssessmentId');
  if (!batch) {
    throw new Error('Produce batch not found or access unauthorized.');
  }
  return batch;
};

/**
 * Perform AI Quality Assessment on a batch
 */
const assessBatchQuality = async ({ batchId, farmerId, imageBase64, mimeType, imagePath, req }) => {
  const batch = await ProduceBatch.findOne({ _id: batchId, farmerId });
  if (!batch) {
    throw new Error('Produce batch not found or access unauthorized.');
  }

  // Call Gemini AI service
  const assessment = await assessProduceQuality({
    imageBase64,
    mimeType,
    cropName: batch.cropName,
  });

  const record = await QualityAssessment.create({
    batchId: batch._id,
    farmerId,
    imageUrl: imagePath,
    classification: assessment.classification,
    confidence: assessment.confidence,
    observations: assessment.observations,
    estimatedShelfLife: assessment.estimatedShelfLife,
    recommendedAction: assessment.recommendedAction,
  });

  // Link assessment to batch and update grade
  batch.qualityAssessmentId = record._id;
  batch.qualityGrade = assessment.classification;
  await batch.save();

  await logAuditEvent({
    req,
    actorId: farmerId,
    action: 'QUALITY_ASSESSMENT_PERFORMED',
    resource: 'QualityAssessment',
    resourceId: record._id,
    result: 'SUCCESS',
    metadata: { batchId: batch.batchId, classification: assessment.classification },
  });

  // Asynchronously dispatch AI quality assessment results to farmer
  setImmediate(async () => {
    try {
      const user = await User.findById(farmerId).select('email fullName emailPreferences');
      if (user && user.email) {
        queueEmail({
          to: user.email,
          template: 'quality-assessment',
          subject: `AI Quality Report Ready — Batch ${batch.batchId} — KhetiSetu`,
          context: {
            farmerName: user.fullName || 'Farmer Partner',
            batchId: batch.batchId,
            cropName: batch.cropName,
            classification: assessment.classification,
            confidence: assessment.confidence,
            observations: assessment.observations,
            estimatedShelfLife: assessment.estimatedShelfLife,
            recommendedAction: assessment.recommendedAction,
            disclaimer: 'AI visual analysis only — not certified laboratory testing.',
            listingUrl: `${emailConfig.appUrl}/farmer/listings?batchId=${batch._id}`,
          },
          user,
        });
      }

      // If produce does not meet quality criteria, alert platform administrators
      if (assessment.classification === 'QUALITY_CRITERIA_NOT_MET') {
        queueEmail({
          to: emailConfig.adminEmail,
          template: 'admin-alert',
          subject: `[Quality Flag] Batch ${batch.batchId} Failed Quality Assessment`,
          context: {
            alertTitle: 'Sub-Standard Quality Produce Flagged',
            alertMessage: `Batch ${batch.batchId} failed standard quality criteria during AI analysis and may require manual inspection.`,
            details: {
              BatchID: batch.batchId,
              Crop: batch.cropName,
              Farmer: user?.fullName || 'Farmer Partner',
              Confidence: `${assessment.confidence}%`,
              Reason: assessment.recommendedAction,
            },
            adminUrl: `${emailConfig.appUrl}/admin`,
          },
        });
      }
    } catch (err) {}
  });

  return { batch, assessment: record };
};

/**
 * Create Marketplace Listing from an existing Batch
 */
const createListing = async (farmerId, listingData, req) => {
  const batch = await ProduceBatch.findOne({ _id: listingData.batchId, farmerId });
  if (!batch) {
    throw new Error('Specified produce batch not found or access unauthorized.');
  }

  if (listingData.availableQuantity > batch.availableQuantity) {
    throw new Error(`Requested listing quantity (${listingData.availableQuantity}) exceeds batch available stock (${batch.availableQuantity}).`);
  }

  const farmerProfile = await getProfile(farmerId);
  const crop = await Crop.findOne({ name: new RegExp(`^${batch.cropName}$`, 'i') });

  const product = await Product.create({
    batchId: batch._id,
    farmerId,
    title: listingData.title || `Farm Fresh ${batch.cropName} (${batch.batchId})`,
    description: listingData.description || `Directly harvested from ${farmerProfile.farmName}. High quality, clean and graded produce.`,
    category: crop ? crop.category : 'VEGETABLE',
    pricePerUnit: listingData.pricePerUnit,
    unit: batch.unit,
    minOrderQuantity: listingData.minOrderQuantity || 1,
    maxOrderQuantity: listingData.maxOrderQuantity || listingData.availableQuantity,
    availableQuantity: listingData.availableQuantity,
    images: listingData.imageUrl
      ? [listingData.imageUrl]
      : listingData.images && listingData.images.length
      ? listingData.images
      : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'],
    qualityGrade: batch.qualityGrade !== 'PENDING_ASSESSMENT' ? batch.qualityGrade : 'UNRATED',
    isB2C: listingData.isB2C !== undefined ? listingData.isB2C : true,
    isB2B: listingData.isB2B !== undefined ? listingData.isB2B : false,
    status: 'ACTIVE',
    location: {
      state: farmerProfile.location.state,
      district: farmerProfile.location.district,
    },
  });

  // Update batch listing status
  batch.listingStatus = 'LISTED_FULL';
  await batch.save();

  await logAuditEvent({
    req,
    actorId: farmerId,
    action: 'MARKETPLACE_PRODUCT_LISTED',
    resource: 'Product',
    resourceId: product._id,
    result: 'SUCCESS',
    metadata: { title: product.title, pricePerUnit: product.pricePerUnit },
  });

  // Asynchronously dispatch listing published email to farmer
  setImmediate(async () => {
    try {
      const user = await User.findById(farmerId).select('email fullName emailPreferences');
      if (user && user.email) {
        queueEmail({
          to: user.email,
          template: 'listing-published',
          subject: `Your listing is live on KhetiSetu 🌿 — ${product.title}`,
          context: {
            farmerName: user.fullName || 'Farmer Partner',
            listingTitle: product.title,
            pricePerUnit: product.pricePerUnit,
            unit: product.unit,
            availableQuantity: product.availableQuantity,
            qualityGrade: product.qualityGrade,
            listingUrl: `${emailConfig.appUrl}/marketplace/${product._id}`,
          },
          user,
        });
      }
    } catch (err) {}
  });

  return product;
};

/**
 * Get farmer revenue and order dashboard analytics
 */
const getFarmerAnalytics = async (farmerId) => {
  const [orders, activeListingsCount, batchesCount] = await Promise.all([
    Order.find({ farmerId, status: { $ne: 'CANCELLED' } }).select('total status createdAt items'),
    Product.countDocuments({ farmerId, status: 'ACTIVE' }),
    ProduceBatch.countDocuments({ farmerId }),
  ]);

  const totalRevenue = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
  const completedOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const pendingOrdersCount = orders.filter((o) => ['PLACED', 'CONFIRMED', 'PACKED', 'ASSIGNED', 'OUT_FOR_DELIVERY'].includes(o.status)).length;

  return {
    totalRevenue,
    completedOrdersCount,
    pendingOrdersCount,
    totalOrdersCount: orders.length,
    activeListingsCount,
    batchesCount,
  };
};

module.exports = {
  getProfile,
  updateProfile,
  createBatch,
  getMyBatches,
  getBatchById,
  assessBatchQuality,
  createListing,
  getFarmerAnalytics,
};
