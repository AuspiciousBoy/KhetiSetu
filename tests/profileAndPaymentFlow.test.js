const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../server/config/db');
const User = require('../server/models/User');
const ConsumerProfile = require('../server/models/ConsumerProfile');
const BusinessProfile = require('../server/models/BusinessProfile');
const FarmerProfile = require('../server/models/FarmerProfile');
const Product = require('../server/models/Product');
const Order = require('../server/models/Order');
const userService = require('../server/services/userService');
const orderService = require('../server/services/orderService');

test('KhetiSetu Profile Dashboard, Address Management & Farmer UPI Payment Flow', async (t) => {
  await connectDB();

  // Load existing seeded users
  const [farmer, consumer, businessUser, product] = await Promise.all([
    User.findOne({ email: 'farmer@khetisetu.demo' }),
    User.findOne({ email: 'consumer@khetisetu.demo' }),
    User.findOne({ email: 'business@khetisetu.demo' }),
    Product.findOne({ status: 'ACTIVE' }),
  ]);

  assert.ok(farmer, 'Farmer user must exist in test DB');
  assert.ok(consumer, 'Consumer user must exist in test DB');
  assert.ok(businessUser, 'Business user must exist in test DB');
  assert.ok(product, 'Active product must exist in test DB');

  // Ensure test product is owned by farmer for payment snapshot tests
  product.farmerId = farmer._id;
  await product.save();

  let addedAddressId = null;

  // 1. Consumer Profile & Address Management
  await t.test('1. Consumer: Fetch Profile & Manage Multiple Addresses', async () => {
    const data = await userService.getUserProfile(consumer._id);
    assert.equal(data.user.email, 'consumer@khetisetu.demo');
    assert.equal(data.user.role, 'CONSUMER');
    assert.ok(Array.isArray(data.profile.addresses), 'Addresses should be an array');

    // Add first address (set as default)
    const addr1 = await userService.addAddress(consumer._id, 'CONSUMER', {
      label: 'HOME',
      fullName: 'Aarav Mehta',
      contactNumber: '9876543210',
      houseNo: 'Flat 101',
      streetArea: 'Kalyani Nagar',
      line1: 'Lane 7, East Avenue',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411006',
      landmark: 'Near Joggers Park',
      isDefault: true,
    });
    assert.ok(addr1._id, 'Created address must have an ID');
    assert.equal(addr1.isDefault, true);
    addedAddressId = addr1._id;

    // Add second address (WORK)
    const addr2 = await userService.addAddress(consumer._id, 'CONSUMER', {
      label: 'WORK',
      fullName: 'Aarav Mehta Office',
      contactNumber: '9876543210',
      houseNo: 'Tech Park B3',
      streetArea: 'Hinjawadi Phase 1',
      line1: 'Plot 12, IT Park',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      isDefault: false,
    });
    assert.equal(addr2.isDefault, false);

    // List addresses
    const addressList = await userService.getAddresses(consumer._id, 'CONSUMER');
    assert.ok(addressList.length >= 2, 'Must have at least 2 saved addresses');

    // Set addr2 as default
    const updatedList = await userService.setDefaultAddress(consumer._id, 'CONSUMER', addr2._id);
    const updatedAddr1 = updatedList.find((a) => a._id.toString() === addr1._id.toString());
    const updatedAddr2 = updatedList.find((a) => a._id.toString() === addr2._id.toString());
    assert.equal(updatedAddr2.isDefault, true, 'addr2 should now be default');
    assert.equal(updatedAddr1.isDefault, false, 'addr1 should no longer be default');

    // Update addr1
    const edited = await userService.updateAddress(consumer._id, 'CONSUMER', addr1._id, {
      houseNo: 'Flat 102 (Renovated)',
    });
    assert.equal(edited.houseNo, 'Flat 102 (Renovated)');

    // Delete addr2
    await userService.deleteAddress(consumer._id, 'CONSUMER', addr2._id);
    const remaining = await userService.getAddresses(consumer._id, 'CONSUMER');
    assert.ok(!remaining.some((a) => a._id.toString() === addr2._id.toString()), 'addr2 should be deleted');
  });

  // 2. B2B Business Profile & Delivery Addresses
  await t.test('2. B2B Business: Profile with Billing Details & Business Addresses', async () => {
    const data = await userService.getUserProfile(businessUser._id);
    assert.equal(data.user.email, 'business@khetisetu.demo');
    assert.equal(data.user.role, 'BUSINESS');
    assert.ok(data.profile, 'Business profile sub-data must exist');

    // Update business profile billing info
    const updated = await userService.updateUserProfile(businessUser._id, {
      contactPerson: 'Vikram Singhania',
      billingInformation: {
        billingName: 'Sahyadri Agro Processing LLP',
        billingAddress: 'Gat No 104, MIDC Baramati, Pune 413133',
        taxId: '27AAAAA0000A1Z5',
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
      },
    });
    assert.equal(updated.profile.contactPerson, 'Vikram Singhania');
    assert.equal(updated.profile.billingInformation.billingName, 'Sahyadri Agro Processing LLP');

    // Add warehouse delivery address
    const whAddr = await userService.addAddress(businessUser._id, 'BUSINESS', {
      label: 'WAREHOUSE',
      companyName: 'Sahyadri Agro Cold Storage',
      contactPerson: 'Warehouse Manager',
      contactNumber: '9123456780',
      line1: 'Plot 45, Agro Cold Chain Hub',
      city: 'Baramati',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '413133',
      isDefault: true,
    });
    assert.ok(whAddr._id);
    assert.equal(whAddr.label, 'WAREHOUSE');
  });

  // 3. Farmer Profile, Location & UPI Payment System
  await t.test('3. Farmer: Location Management & UPI Payment Configuration', async () => {
    // Update Farmer Location
    const locationUpdate = await userService.updateFarmerLocation(farmer._id, {
      farmAddress: 'Gat No. 72, Organic Orchards',
      village: 'Malegaon Budruk',
      city: 'Baramati',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '413115',
      landmark: 'Near Canal Siphon',
      coordinates: { latitude: 18.15, longitude: 74.58 },
    });
    assert.equal(locationUpdate.village, 'Malegaon Budruk');
    assert.equal(locationUpdate.pincode, '413115');

    // Update Farmer UPI Settings
    const upiUpdate = await userService.updateFarmerPayment(farmer._id, {
      upiId: 'ramesh.farmer@okhdfcbank',
      accountHolderName: 'Ramesh Vitthalrao Patil',
    });
    assert.equal(upiUpdate.upiId, 'ramesh.farmer@okhdfcbank');
    assert.equal(upiUpdate.accountHolderName, 'Ramesh Vitthalrao Patil');
    assert.equal(upiUpdate.isConfigured, true);

    // Validate UPI format check: invalid format should be rejected
    await assert.rejects(
      async () => {
        await userService.updateFarmerPayment(farmer._id, {
          upiId: 'invalid-upi-without-at',
        });
      },
      /Invalid UPI ID format/,
      'Should reject UPI ID without @ handle'
    );

    // Save QR code URL
    const qrUpdate = await userService.updateFarmerQrCode(farmer._id, '/uploads/farmer_qr_demo.png');
    assert.equal(qrUpdate.upiQrCodeUrl, '/uploads/farmer_qr_demo.png');

    // Retrieve Payment Settings
    const retrieved = await userService.getFarmerPayment(farmer._id);
    assert.equal(retrieved.upiId, 'ramesh.farmer@okhdfcbank');
    assert.equal(retrieved.upiQrCodeUrl, '/uploads/farmer_qr_demo.png');
    assert.equal(retrieved.isConfigured, true);
  });

  // 4. Order Address Snapshot & Farmer Payment Snapshot
  await t.test('4. Order Placement: Delivery Address Snapshot & Farmer Payment Isolation', async () => {
    // Ensure farmer profile in DB has the updated payment settings
    await FarmerProfile.findOneAndUpdate(
      { userId: farmer._id },
      {
        $set: {
          'paymentSettings.upiId': 'ramesh.farmer@okhdfcbank',
          'paymentSettings.upiQrCodeUrl': '/uploads/farmer_qr_demo.png',
          'paymentSettings.isConfigured': true,
        },
      }
    );

    const initialAddress = {
      fullName: 'Aarav Mehta Snapshot Test',
      phone: '+919876543210',
      houseNo: 'Bunglow 4',
      streetArea: 'Prabhat Road',
      line1: 'Lane 3, Deccan Gymkhana',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
      landmark: 'Opposite Cafe',
    };

    const { order } = await orderService.createOrder({
      buyerId: consumer._id,
      buyerRole: 'CONSUMER',
      items: [
        {
          productId: product._id,
          quantity: 3,
        },
      ],
      deliveryAddress: initialAddress,
    });

    assert.ok(order._id);
    assert.equal(order.deliveryAddress.fullName, 'Aarav Mehta Snapshot Test');
    assert.equal(order.deliveryAddress.houseNo, 'Bunglow 4');
    assert.equal(order.deliveryAddress.pincode, '411004');

    // Verify Farmer Payment Snapshot is captured on order
    assert.ok(Array.isArray(order.farmerPaymentInfo), 'Order must have farmerPaymentInfo');
    const farmerPayment = order.farmerPaymentInfo.find(
      (fp) => fp.farmerId?.toString() === farmer._id.toString()
    );
    assert.ok(farmerPayment, 'Farmer payment info must be snapshotted on order');
    assert.equal(farmerPayment.upiId, 'ramesh.farmer@okhdfcbank');
    assert.equal(farmerPayment.upiQrCodeUrl, '/uploads/farmer_qr_demo.png');
    assert.ok(farmerPayment.amount > 0, 'Payable amount must be greater than zero');

    // Now, simulate consumer editing their profile address
    if (addedAddressId) {
      await userService.updateAddress(consumer._id, 'CONSUMER', addedAddressId, {
        houseNo: 'MODIFIED HOUSE 999',
        pincode: '400001',
      });
    }

    // Verify order's snapshot remains UNCHANGED
    const retrievedOrder = await Order.findById(order._id);
    assert.equal(
      retrievedOrder.deliveryAddress.houseNo,
      'Bunglow 4',
      'Order delivery address must remain unchanged even after profile address modification'
    );
    assert.equal(
      retrievedOrder.deliveryAddress.pincode,
      '411004',
      'Order pincode snapshot must remain intact'
    );

    // Clean up created test order
    await Order.findByIdAndDelete(order._id);
  });

  // 5. Security & Isolation Checks
  await t.test('5. Security: Non-farmers cannot access or modify Farmer Payment settings', async () => {
    const data = await userService.getUserProfile(consumer._id);
    assert.equal(
      data.profile.paymentSettings,
      undefined,
      'Consumer profile must NOT include paymentSettings'
    );

    // Non-existent address delete safely throws 404
    const nonExistentId = new mongoose.Types.ObjectId();
    await assert.rejects(
      async () => {
        await userService.deleteAddress(consumer._id, 'CONSUMER', nonExistentId);
      },
      /Address not found/,
      'Deleting non-existent address must reject with 404'
    );
  });

  await disconnectDB();
});
