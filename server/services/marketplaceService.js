const Product = require('../models/Product');
const FarmerProfile = require('../models/FarmerProfile');
const ProduceBatch = require('../models/ProduceBatch');
const QualityAssessment = require('../models/QualityAssessment');
const Review = require('../models/Review');
const User = require('../models/User');

/**
 * Sanitize public product payload for consumers and businesses
 */
const formatProductDTO = (product, farmerProfile = null, batch = null, quality = null, farmerUser = null) => {
  const farmerName = farmerUser?.fullName || farmerProfile?.farmName || 'Certified Farmer';
  const farmName = farmerProfile?.farmName || (farmerUser?.fullName ? `${farmerUser.fullName}'s Farm` : 'Certified Farm');
  const upiId = farmerProfile?.paymentSettings?.upiId || '';
  const upiQrCodeUrl = farmerProfile?.paymentSettings?.upiQrCodeUrl || '';
  const isPaymentConfigured = Boolean(farmerProfile?.paymentSettings?.isConfigured && upiId);

  return {
    id: product._id,
    title: product.title,
    description: product.description,
    category: product.category,
    pricePerUnit: product.pricePerUnit,
    unit: product.unit,
    minOrderQuantity: product.minOrderQuantity,
    maxOrderQuantity: product.maxOrderQuantity,
    availableQuantity: product.availableQuantity,
    images: product.images || [],
    imageUrl: product.images?.[0] || product.imageUrl || '',
    qualityGrade: product.qualityGrade,
    isB2C: product.isB2C,
    isB2B: product.isB2B,
    status: product.status,
    location: product.location,
    rating: product.rating,
    reviewsCount: product.reviewsCount,
    farmer: {
      id: farmerUser?._id || farmerProfile?.userId || product.farmerId,
      fullName: farmerName,
      farmName: farmName,
      phone: farmerUser?.phone || '',
      email: farmerUser?.email || '',
      location: farmerProfile?.location || {
        farmAddress: '',
        village: '',
        city: '',
        district: product.location?.district || 'General',
        state: product.location?.state || 'Maharashtra',
        pincode: '',
        coordinates: null,
      },
      village: farmerProfile?.location?.village || '',
      city: farmerProfile?.location?.city || '',
      district: farmerProfile?.location?.district || product.location?.district || 'General',
      state: farmerProfile?.location?.state || product.location?.state || 'Maharashtra',
      pincode: farmerProfile?.location?.pincode || '',
      farmAddress: farmerProfile?.location?.farmAddress || '',
      coordinates: farmerProfile?.location?.coordinates || null,
      rating: farmerProfile?.rating || product.rating || 4.8,
      isVerified: Boolean(farmerProfile?.isVerified),
      upiId,
      upiQrCodeUrl,
      payment: {
        upiId,
        upiQrCodeUrl,
        accountHolderName: farmerProfile?.paymentSettings?.accountHolderName || farmerName,
        isConfigured: isPaymentConfigured,
      },
    },
    batchTraceability: batch
      ? {
          batchId: batch.batchId,
          cropName: batch.cropName,
          harvestDate: batch.harvestDate,
          shelfLifeDays: batch.shelfLifeDays,
          storageMethod: batch.storageInformation?.method,
        }
      : undefined,
    qualityAssessment: quality
      ? {
          classification: quality.classification,
          confidence: quality.confidence,
          observations: quality.observations,
          estimatedShelfLife: quality.estimatedShelfLife,
          assessedAt: quality.assessedAt,
          disclaimer: quality.disclaimer,
        }
      : undefined,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

/**
 * Query marketplace products with safe filters, sorting, and pagination
 */
const listProducts = async ({
  page = 1,
  limit = 20,
  category,
  minPrice,
  maxPrice,
  district,
  state,
  qualityGrade,
  isB2B,
  isB2C,
  search,
  sort = 'createdAt_desc',
}) => {
  const query = { status: 'ACTIVE', availableQuantity: { $gt: 0 } };

  if (category) query.category = category;
  if (district) query['location.district'] = new RegExp(`^${district}$`, 'i');
  if (state) query['location.state'] = new RegExp(`^${state}$`, 'i');
  if (qualityGrade) query.qualityGrade = qualityGrade;
  if (isB2B !== undefined) query.isB2B = isB2B === 'true' || isB2B === true;
  if (isB2C !== undefined) query.isB2C = isB2C === 'true' || isB2C === true;

  if (minPrice || maxPrice) {
    query.pricePerUnit = {};
    if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
    if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
  }

  if (search && search.trim().length >= 2) {
    const safeRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: safeRegex }, { description: safeRegex }];
  }

  // Safe sort mapping
  const sortMap = {
    price_asc: { pricePerUnit: 1 },
    price_desc: { pricePerUnit: -1 },
    rating_desc: { rating: -1 },
    createdAt_desc: { createdAt: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50); // Max 50 items per page
  const parsedPage = Math.max(Number(page) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('farmerId', 'fullName email phone')
      .populate('batchId', 'batchId cropName harvestDate shelfLifeDays storageInformation')
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit),
    Product.countDocuments(query),
  ]);

  const farmerIds = products.map((p) => p.farmerId?._id || p.farmerId).filter(Boolean);
  const profiles = await FarmerProfile.find({ userId: { $in: farmerIds } });
  const profileMap = new Map(profiles.map((fp) => [fp.userId.toString(), fp]));

  const items = products.map((prod) => {
    const fId = (prod.farmerId?._id || prod.farmerId)?.toString();
    const fProfile = profileMap.get(fId);
    return formatProductDTO(prod, fProfile, prod.batchId, null, prod.farmerId);
  });

  return { items, total, page: parsedPage, limit: parsedLimit };
};

/**
 * Get full product detail including batch provenance and quality assessment report
 */
const getProductById = async (productId) => {
  const product = await Product.findById(productId);
  if (!product || product.status === 'ARCHIVED') {
    throw new Error('Product listing not found or inactive.');
  }

  // Increment views counter
  product.viewsCount = (product.viewsCount || 0) + 1;
  await product.save();

  const [farmerUser, farmerProfile, batch, reviews] = await Promise.all([
    User.findById(product.farmerId).select('fullName phone email'),
    FarmerProfile.findOne({ userId: product.farmerId }),
    ProduceBatch.findById(product.batchId),
    Review.find({ productId: product._id }).sort({ createdAt: -1 }).limit(10),
  ]);

  let quality = null;
  if (batch && batch.qualityAssessmentId) {
    quality = await QualityAssessment.findById(batch.qualityAssessmentId);
  }

  const dto = formatProductDTO(product, farmerProfile, batch, quality, farmerUser);
  dto.reviews = reviews;
  return dto;
};

module.exports = {
  listProducts,
  getProductById,
  formatProductDTO,
};
