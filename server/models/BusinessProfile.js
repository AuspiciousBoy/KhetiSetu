const mongoose = require('mongoose');

const BusinessAddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Warehouse' }, // Warehouse, Office, Factory, Other
    warehouseName: { type: String, default: 'Central Warehouse' }, // Legacy compatibility
    companyName: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    houseNo: { type: String, trim: true },
    streetArea: { type: String, trim: true },
    line1: { type: String, required: [true, 'Address line 1 is required'], trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: [true, 'City is required'], trim: true },
    district: { type: String, trim: true },
    state: { type: String, required: [true, 'State is required'], trim: true },
    pincode: { type: String, required: [true, 'PIN code is required'], trim: true },
    landmark: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const BusinessProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: 150,
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    businessType: {
      type: String,
      enum: ['RETAILER', 'WHOLESALER', 'FOOD_PROCESSOR', 'SUPERMARKET_CHAIN', 'EXPORTER', 'RESTAURANT', 'INSTITUTION'],
      default: 'WHOLESALER',
    },
    gstNumber: {
      type: String,
      required: [true, 'GSTIN is compulsory for business accounts'],
      trim: true,
      uppercase: true,
      index: true,
    },
    procurementVolumePerMonthTons: {
      type: Number,
      default: 5,
    },
    billingInformation: {
      billingName: { type: String, trim: true },
      billingAddress: { type: String, trim: true },
      taxId: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },
    deliveryAddresses: [BusinessAddressSchema],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BusinessProfile', BusinessProfileSchema);
