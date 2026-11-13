const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const FarmerProfile = require('../models/FarmerProfile');
const ConsumerProfile = require('../models/ConsumerProfile');
const BusinessProfile = require('../models/BusinessProfile');
const Crop = require('../models/Crop');
const ProduceBatch = require('../models/ProduceBatch');
const Product = require('../models/Product');
const QualityAssessment = require('../models/QualityAssessment');
const MarketPrice = require('../models/MarketPrice');
const Vehicle = require('../models/Vehicle');
const { hashPassword } = require('../utils/tokens');
const logger = require('../utils/logger');

const seed = async () => {
  logger.info('Connecting to MongoDB for seeding...');
  await connectDB();

  logger.info('Clearing existing development seed collections...');
  await Promise.all([
    User.deleteMany({ email: /@khetisetu\.demo$/ }),
    FarmerProfile.deleteMany({}),
    ConsumerProfile.deleteMany({}),
    BusinessProfile.deleteMany({}),
    Crop.deleteMany({}),
    ProduceBatch.deleteMany({}),
    Product.deleteMany({}),
    QualityAssessment.deleteMany({}),
    MarketPrice.deleteMany({}),
    Vehicle.deleteMany({}),
  ]);

  logger.info('Seeding Demo Users with Argon2id password hashes...');
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD || process.env.DEMO_USER_PASSWORD || 'KhetiSetu@2026!';
  const defaultPasswordHash = await hashPassword(seedPassword);
  const adminPasswordHash = await hashPassword('admin123');

  const [farmerUser, consumerUser, businessUser, adminUser] = await Promise.all([
    User.create({
      email: 'farmer@khetisetu.demo',
      passwordHash: defaultPasswordHash,
      fullName: 'Rameshwar Patil',
      phone: '+919876543210',
      role: 'FARMER',
      isEmailVerified: true,
    }),
    User.create({
      email: 'consumer@khetisetu.demo',
      passwordHash: defaultPasswordHash,
      fullName: 'Pooja Sharma',
      phone: '+919876543211',
      role: 'CONSUMER',
      isEmailVerified: true,
    }),
    User.create({
      email: 'business@khetisetu.demo',
      passwordHash: defaultPasswordHash,
      fullName: 'Vikram Agrawal',
      phone: '+919876543212',
      role: 'BUSINESS',
      isEmailVerified: true,
    }),
    User.create({
      email: 'admin@khetisetu.demo',
      passwordHash: adminPasswordHash,
      fullName: 'Super Administrator',
      phone: '+919876543213',
      role: 'ADMIN',
      isEmailVerified: true,
    }),
  ]);

  logger.info('Seeding User Profiles...');
  const farmerProfile = await FarmerProfile.create({
    userId: farmerUser._id,
    farmName: 'Sahyadri Organic Agro Farm',
    location: {
      farmAddress: 'Gat No. 42, Shivapur Farm Belt',
      village: 'Khed Shivapur',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '412205',
      landmark: 'Near Sinhagad Agro Water Stream',
      coordinates: { latitude: 18.35, longitude: 73.85 },
    },
    paymentSettings: {
      upiId: 'sahyadri.farmer@okaxis',
      accountHolderName: 'Rameshwar Patil',
      isConfigured: true,
      updatedAt: new Date(),
    },
    landSizeAcres: 8.5,
    soilType: 'ALLUVIAL',
    cropsGrown: ['Tomato', 'Onion', 'Potato', 'Spinach'],
    isVerified: true,
    rating: 4.9,
    totalBatchesHarvested: 24,
    bio: 'Pioneering organic farm specializing in pesticide-residue-free tomatoes and red onions with farm-gate sorting.',
  });

  await ConsumerProfile.create({
    userId: consumerUser._id,
    addresses: [
      {
        label: 'Home',
        title: 'Home',
        fullName: 'Ananya Sharma',
        contactNumber: '+919876543211',
        houseNo: 'Flat 402',
        streetArea: 'Baner Road',
        line1: 'Green Acres Residency, Baner Road',
        line2: 'Near Orchid School',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        landmark: 'Near Orchid School',
        isDefault: true,
      },
    ],
    preferences: {
      organicOnly: true,
      favoriteCrops: ['Tomato', 'Spinach', 'Mango'],
    },
  });

  await BusinessProfile.create({
    userId: businessUser._id,
    businessName: 'FreshDirect Hypermarkets Pvt Ltd',
    contactPerson: 'Karan Malhotra',
    businessType: 'SUPERMARKET_CHAIN',
    gstNumber: '27AABCF1234F1Z5',
    procurementVolumePerMonthTons: 25,
    billingInformation: {
      billingName: 'FreshDirect Hypermarkets Pvt Ltd',
      billingAddress: 'Unit 501, World Trade Center, Kharadi, Pune 411014',
      taxId: '27AABCF1234F1Z5',
      bankName: 'HDFC Bank',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
    },
    deliveryAddresses: [
      {
        label: 'Warehouse',
        warehouseName: 'Pune Central Cold Storage Hub',
        companyName: 'FreshDirect Hypermarkets Pvt Ltd',
        contactPerson: 'Karan Malhotra',
        contactNumber: '+919876543212',
        houseNo: 'Plot 18',
        streetArea: 'Hinjewadi Phase 2 MIDC',
        line1: 'Plot 18, Hinjewadi Phase 2 MIDC',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411057',
        isDefault: true,
      },
    ],
    isVerified: true,
  });

  logger.info('Seeding Crops Catalog...');
  const cropsData = [
    {
      name: 'Tomato',
      hindiName: 'टमाटर',
      category: 'VEGETABLE',
      season: 'ALL_SEASON',
      unit: 'kg',
      standardPriceRange: { min: 20, max: 45 },
      typicalShelfLifeDays: 8,
      optimalStorageTempC: 15,
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Potato',
      hindiName: 'आलू',
      category: 'VEGETABLE',
      season: 'RABI',
      unit: 'kg',
      standardPriceRange: { min: 18, max: 32 },
      typicalShelfLifeDays: 30,
      optimalStorageTempC: 10,
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Onion',
      hindiName: 'प्याज',
      category: 'VEGETABLE',
      season: 'KHARIF',
      unit: 'kg',
      standardPriceRange: { min: 25, max: 55 },
      typicalShelfLifeDays: 45,
      optimalStorageTempC: 22,
      imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Rice',
      hindiName: 'चावल (बासमती)',
      category: 'GRAIN_CEREAL',
      season: 'KHARIF',
      unit: 'kg',
      standardPriceRange: { min: 60, max: 120 },
      typicalShelfLifeDays: 365,
      optimalStorageTempC: 24,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Wheat',
      hindiName: 'गेहूं (शरबती)',
      category: 'GRAIN_CEREAL',
      season: 'RABI',
      unit: 'kg',
      standardPriceRange: { min: 30, max: 48 },
      typicalShelfLifeDays: 365,
      optimalStorageTempC: 24,
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Banana',
      hindiName: 'केला (G9)',
      category: 'FRUIT',
      season: 'ALL_SEASON',
      unit: 'kg',
      standardPriceRange: { min: 25, max: 40 },
      typicalShelfLifeDays: 6,
      optimalStorageTempC: 14,
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Mango',
      hindiName: 'आम (हापुस/Alphonso)',
      category: 'FRUIT',
      season: 'ZAID',
      unit: 'box',
      standardPriceRange: { min: 600, max: 1400 },
      typicalShelfLifeDays: 7,
      optimalStorageTempC: 13,
      imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Spinach',
      hindiName: 'पालक',
      category: 'VEGETABLE',
      season: 'ALL_SEASON',
      unit: 'kg',
      standardPriceRange: { min: 15, max: 35 },
      typicalShelfLifeDays: 3,
      optimalStorageTempC: 6,
      imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800',
    },
  ];

  const createdCrops = await Crop.insertMany(cropsData);
  const tomatoCrop = createdCrops.find((c) => c.name === 'Tomato');
  const onionCrop = createdCrops.find((c) => c.name === 'Onion');
  const mangoCrop = createdCrops.find((c) => c.name === 'Mango');

  logger.info('Seeding Produce Batches & Quality Assessments...');
  const batch1 = await ProduceBatch.create({
    batchId: 'BATCH-TOM-2026-A101',
    farmerId: farmerUser._id,
    cropId: tomatoCrop._id,
    cropName: 'Tomato',
    quantity: 1200,
    availableQuantity: 1100,
    unit: 'kg',
    harvestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    storageInformation: {
      method: 'Cooled Field Packhouse',
      location: 'Barn Bay 3',
      humidityControl: true,
    },
    shelfLifeDays: 10,
    qualityGrade: 'GOOD_QUALITY',
    listingStatus: 'LISTED_FULL',
    originLocation: {
      state: 'Maharashtra',
      district: 'Pune',
      village: 'Khed Shivapur',
    },
    notes: 'Premium grade hybrid round tomatoes, high brix sugar index, harvested at breaker stage.',
  });

  const qa1 = await QualityAssessment.create({
    batchId: batch1._id,
    farmerId: farmerUser._id,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
    classification: 'GOOD_QUALITY',
    confidence: 0.94,
    observations: [
      'Vibrant deep-red gloss with intact natural wax cuticle.',
      'Calibre firmness is 92% uniform; no mechanical abrasions detected.',
      'Optimal firmness suitable for both retail shelf and extended transit.',
      'Zero signs of late blight (Phytophthora) or blossom-end rot.',
    ],
    estimatedShelfLife: '8 - 10 days in ventilated conditions',
    recommendedAction: 'Qualified for Grade-A Premium Marketplace Listing. Ideal for direct consumer sale or wholesale export.',
  });

  batch1.qualityAssessmentId = qa1._id;
  await batch1.save();

  const batch2 = await ProduceBatch.create({
    batchId: 'BATCH-ONI-2026-B202',
    farmerId: farmerUser._id,
    cropId: onionCrop._id,
    cropName: 'Onion',
    quantity: 5000,
    availableQuantity: 4800,
    unit: 'kg',
    harvestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    storageInformation: {
      method: 'Traditional Slatted Chawl',
      location: 'Aerated Warehouse A',
      humidityControl: false,
    },
    shelfLifeDays: 45,
    qualityGrade: 'GOOD_QUALITY',
    listingStatus: 'LISTED_FULL',
    originLocation: {
      state: 'Maharashtra',
      district: 'Pune',
      village: 'Khed Shivapur',
    },
    notes: 'Nashik red onions, medium size 45-55mm, cured with dry papery skin.',
  });

  logger.info('Seeding Marketplace Listings (B2C & B2B)...');
  await Product.create({
    batchId: batch1._id,
    farmerId: farmerUser._id,
    title: 'Grade-A Farm Fresh Hybrid Tomatoes',
    description: 'Directly harvested from Sahyadri Organic Farm. Naturally vine-ripened, firm, juicy, and rich in lycopene. Tested under KhetiSetu AI quality protocols.',
    category: 'VEGETABLE',
    pricePerUnit: 34,
    unit: 'kg',
    minOrderQuantity: 2,
    maxOrderQuantity: 100,
    availableQuantity: 300,
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'],
    qualityGrade: 'GOOD_QUALITY',
    isB2C: true,
    isB2B: false,
    status: 'ACTIVE',
    location: { state: 'Maharashtra', district: 'Pune' },
    rating: 4.9,
    reviewsCount: 18,
  });

  await Product.create({
    batchId: batch1._id,
    farmerId: farmerUser._id,
    title: 'Bulk Premium Tomato Lot (Crater Sorted)',
    description: 'Bulk commercial lot for hypermarkets and processors. 20kg standard agricultural plastic crates available. Fast truckload dispatch.',
    category: 'VEGETABLE',
    pricePerUnit: 26,
    unit: 'kg',
    minOrderQuantity: 200,
    maxOrderQuantity: 1000,
    availableQuantity: 800,
    images: ['https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&q=80&w=800'],
    qualityGrade: 'GOOD_QUALITY',
    isB2C: false,
    isB2B: true,
    status: 'ACTIVE',
    location: { state: 'Maharashtra', district: 'Pune' },
    rating: 5.0,
    reviewsCount: 4,
  });

  await Product.create({
    batchId: batch2._id,
    farmerId: farmerUser._id,
    title: 'Grade-1 Sun-Cured Red Onions',
    description: 'Top-tier Maharashtra Red Onions with dry protective skin and long shelf-life. Pungent aroma and rich taste.',
    category: 'VEGETABLE',
    pricePerUnit: 38,
    unit: 'kg',
    minOrderQuantity: 5,
    maxOrderQuantity: 500,
    availableQuantity: 1200,
    images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=800'],
    qualityGrade: 'GOOD_QUALITY',
    isB2C: true,
    isB2B: true,
    status: 'ACTIVE',
    location: { state: 'Maharashtra', district: 'Pune' },
    rating: 4.8,
    reviewsCount: 12,
  });

  logger.info('Seeding 30-Day Historical APMC Mandi Prices for Analytics & Prediction...');
  const mandiPrices = [];
  const basePrices = {
    Tomato: 32,
    Onion: 35,
    Potato: 22,
    Wheat: 36,
    Rice: 78,
    Spinach: 20,
    Banana: 30,
    Mango: 950,
  };

  const mandis = [
    { market: 'Pune APMC', district: 'Pune', state: 'Maharashtra' },
    { market: 'Vashi APMC', district: 'Thane', state: 'Maharashtra' },
    { market: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra' },
  ];

  for (let d = 30; d >= 0; d--) {
    const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);

    for (const [cropName, base] of Object.entries(basePrices)) {
      for (const m of mandis) {
        // Natural market price fluctuations (sinusoidal + random walk)
        const fluctuation = Math.sin(d / 4) * (base * 0.12) + (Math.random() - 0.5) * (base * 0.08);
        const mandiDiff = m.market === 'Vashi APMC' ? base * 0.15 : 0;
        const pricePerKg = Math.max(5, Math.round((base + fluctuation + mandiDiff) * 10) / 10);

        mandiPrices.push({
          crop: cropName,
          market: m.market,
          district: m.district,
          state: m.state,
          pricePerKg,
          pricePerQuintal: Math.round(pricePerKg * 100),
          arrivalTons: Math.round(15 + Math.random() * 30),
          date,
          source: 'Agmarknet / APMC Mandi Daily Feed',
        });
      }
    }
  }

  await MarketPrice.insertMany(mandiPrices);

  logger.info('Seeding Logistics Fleet Vehicles...');
  await Vehicle.insertMany([
    {
      registrationNumber: 'MH-12-RN-4589',
      vehicleType: 'PICKUP_VAN',
      capacityKg: 1500,
      operatorName: 'Sanjay Deshmukh',
      operatorPhone: '+919765432101',
      currentDistrict: 'Pune',
      isActive: true,
    },
    {
      registrationNumber: 'MH-14-BT-9821',
      vehicleType: 'REFRIGERATED_VAN',
      capacityKg: 3000,
      operatorName: 'Anil Shinde',
      operatorPhone: '+919765432102',
      currentDistrict: 'Pune',
      isActive: true,
    },
    {
      registrationNumber: 'MH-12-QE-1144',
      vehicleType: 'MINI_TRUCK',
      capacityKg: 2000,
      operatorName: 'Mahesh Jadhav',
      operatorPhone: '+919765432103',
      currentDistrict: 'Pune',
      isActive: true,
    },
  ]);

  logger.info('========================================================');
  logger.info('  Seed completed successfully!');
  logger.info('  Demo Accounts:');
  logger.info('    Farmer:   farmer@khetisetu.demo   / KhetiSetu@2026!');
  logger.info('    Consumer: consumer@khetisetu.demo / KhetiSetu@2026!');
  logger.info('    Business: business@khetisetu.demo / KhetiSetu@2026!');
  logger.info('    Admin:    admin@khetisetu.demo    / KhetiSetu@2026!');
  logger.info('========================================================');

  await disconnectDB();
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seeding failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
