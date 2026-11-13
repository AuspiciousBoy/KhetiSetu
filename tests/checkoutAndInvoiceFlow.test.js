const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../server/config/db');
const User = require('../server/models/User');
const Product = require('../server/models/Product');
const ProduceBatch = require('../server/models/ProduceBatch');
const FarmerProfile = require('../server/models/FarmerProfile');
const ConsumerProfile = require('../server/models/ConsumerProfile');
const BusinessProfile = require('../server/models/BusinessProfile');
const Order = require('../server/models/Order');
const orderService = require('../server/services/orderService');
const userService = require('../server/services/userService');

test('KhetiSetu Checkout, Location, 40% Advance Payment & Invoice System Verification Suite', async (t) => {
  await connectDB();

  // Load existing test users and an active produce listing
  const [farmer, consumer, businessUser, product] = await Promise.all([
    User.findOne({ email: 'farmer@khetisetu.demo' }),
    User.findOne({ email: 'consumer@khetisetu.demo' }),
    User.findOne({ email: 'business@khetisetu.demo' }),
    Product.findOne({ status: 'ACTIVE' }),
  ]);

  assert.ok(farmer, 'Farmer must exist');
  assert.ok(consumer, 'Consumer must exist');
  assert.ok(businessUser, 'Business buyer must exist');
  assert.ok(product, 'Active product must exist');

  // Configure farmer profile with coordinates (Pune: 18.5204, 73.8567) and payment settings
  let fProfile = await FarmerProfile.findOne({ userId: farmer._id });
  if (!fProfile) {
    fProfile = new FarmerProfile({ userId: farmer._id, farmName: "Patil Organic Farm", location: { state: 'Maharashtra', district: 'Pune' } });
  }
  fProfile.location = {
    ...fProfile.location,
    state: 'Maharashtra',
    district: 'Pune',
    coordinates: {
      latitude: 18.5204,
      longitude: 73.8567,
    },
  };
  fProfile.paymentSettings = {
    upiId: 'farmer@okaxis',
    upiQrCodeUrl: '/uploads/test_farmer_qr.png',
    accountHolderName: 'Rameshwar Patil',
    isConfigured: true,
  };
  await fProfile.save();

  // Associate product with farmer
  product.farmerId = farmer._id;
  await product.save();

  let placedConsumerOrder = null;

  // 1. Location & Haversine Distance Calculation
  await t.test('1. Haversine Distance: Computes accurate geographical distance between farmer & buyer', () => {
    // Distance between Pune (18.5204, 73.8567) and Mumbai (18.9220, 72.8347) is approx 118-120 km
    const dist = orderService.calculateHaversineDistanceKm(18.5204, 73.8567, 18.9220, 72.8347);
    assert.ok(dist >= 115 && dist <= 125, `Expected distance around 120km, got ${dist}km`);

    // Zero distance / same coordinates returns minimum 1 km
    const zeroDist = orderService.calculateHaversineDistanceKm(18.5204, 73.8567, 18.5204, 73.8567);
    assert.equal(zeroDist, 1, 'Same location should resolve to minimum 1km');

    // Missing coordinates fallback to default 15 km
    const fallbackDist = orderService.calculateHaversineDistanceKm(null, null, 18.5204, 73.8567);
    assert.equal(fallbackDist, 15, 'Null coords should fallback to 15km');
  });

  // 2. Distance-Based Delivery Charge Calculation
  await t.test('2. Delivery Charge Calculation: Retail vs Commercial freight formulas', () => {
    // Retail (Consumer): Base ₹40 for 5km + ₹6/km beyond
    const fee10kmRetail = orderService.calculateDeliveryFee(10, false);
    // 40 + (10 - 5)*6 = 40 + 30 = ₹70
    assert.equal(fee10kmRetail, 70, 'Retail 10km delivery fee should be ₹70');

    const fee4kmRetail = orderService.calculateDeliveryFee(4, false);
    assert.equal(fee4kmRetail, 40, 'Retail <=5km should charge base ₹40');

    // Commercial (Business): Base ₹500 for 20km + ₹25/km beyond
    const fee50kmB2B = orderService.calculateDeliveryFee(50, true);
    // 500 + (50 - 20)*25 = 500 + 750 = ₹1250
    assert.equal(fee50kmB2B, 1250, 'B2B 50km commercial freight should be ₹1250');

    const fee15kmB2B = orderService.calculateDeliveryFee(15, true);
    assert.equal(fee15kmB2B, 500, 'B2B <=20km should charge base ₹500');
  });

  // 3. Preview Order Quote API Service
  await t.test('3. Preview Order Quote: Calculates subtotal, delivery fee, GST, and 40% advance breakdown', async () => {
    const qty = 5;
    const buyerCoords = { latitude: 18.5600, longitude: 73.9100 }; // ~7 km from Pune farm
    const quote = await orderService.previewOrderQuote({
      items: [{ productId: product._id.toString(), quantity: qty }],
      coordinates: buyerCoords,
      buyerRole: 'CONSUMER',
    });

    const expectedSubtotal = product.pricePerUnit * qty;
    assert.equal(quote.subtotal, expectedSubtotal, 'Subtotal must match pricePerUnit * qty');
    assert.ok(quote.distanceKm > 0, 'Distance must be calculated');
    assert.ok(quote.deliveryFee >= 40, 'Delivery fee must be at least ₹40');

    const expectedTax = Math.round(expectedSubtotal * 0.05);
    assert.equal(quote.tax, expectedTax, 'GST must be 5% of subtotal');

    const expectedTotal = expectedSubtotal + quote.deliveryFee + expectedTax;
    assert.equal(quote.total, expectedTotal, 'Total must equal subtotal + delivery + tax');

    const expectedAdvance = Math.round(expectedTotal * 0.40);
    assert.equal(quote.advanceAmount, expectedAdvance, 'Advance amount must be 40% of grand total');
    assert.equal(quote.pendingAmount, expectedTotal - expectedAdvance, 'Pending must equal total - advance');

    assert.ok(quote.farmerPaymentInfo.length > 0, 'Should include farmer payment details');
    assert.equal(quote.farmerPaymentInfo[0].upiId, 'farmer@okaxis');
    assert.equal(quote.farmerPaymentInfo[0].upiQrCodeUrl, '/uploads/test_farmer_qr.png');
  });

  // 4. Order Creation with Coordinates, Snapshot & 40% Advance Payment Proof
  await t.test('4. Order Creation: Snapshots delivery location, coordinates, financial amounts, and payment proof', async () => {
    const qty = 2;
    const deliveryAddress = {
      fullName: 'Aarav Consumer',
      phone: '+91 9876543210',
      houseNo: 'Flat 402',
      streetArea: 'Koregaon Park',
      line1: 'Lane 5, Koregaon Park',
      city: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      landmark: 'Near Osho Garden',
      coordinates: {
        latitude: 18.5362,
        longitude: 73.8940,
      },
    };

    const paymentProofUrl = '/uploads/sample_payment_screenshot_40percent.png';

    const result = await orderService.createOrder({
      buyerId: consumer._id,
      buyerRole: 'CONSUMER',
      items: [{ productId: product._id.toString(), quantity: qty }],
      deliveryAddress,
      paymentProofUrl,
      paymentMethod: 'DIRECT_ORDER',
    });

    const order = result.order;
    assert.ok(order._id, 'Order must be saved to MongoDB');
    assert.ok(order.orderId.startsWith('ORD-'), 'Order ID must have ORD- prefix');
    assert.ok(order.invoiceNumber.startsWith('INV-'), 'Invoice Number must have INV- prefix');
    assert.equal(order.paymentStatus, 'ADVANCE_PAID', 'Payment status should be ADVANCE_PAID');
    assert.equal(order.paymentProofUrl, paymentProofUrl, 'Payment proof screenshot URL must be stored');
    assert.ok(order.paymentProofUploadedAt, 'Payment proof upload timestamp must be recorded');

    // Verify coordinates snapshot
    assert.equal(order.deliveryAddress.coordinates.latitude, 18.5362);
    assert.equal(order.deliveryAddress.coordinates.longitude, 73.8940);
    assert.ok(order.distanceKm > 0, 'Calculated distance must be saved');

    // Verify 40% advance and 60% pending amounts
    assert.equal(order.advanceAmount, Math.round(order.total * 0.40));
    assert.equal(order.pendingAmount, order.total - order.advanceAmount);

    // Verify buyer & seller details snapshot
    assert.equal(order.buyerDetails.fullName, consumer.fullName);
    assert.equal(order.sellerDetails.fullName, farmer.fullName);
    assert.equal(order.sellerDetails.upiId, 'farmer@okaxis');

    placedConsumerOrder = order;
  });

  // 5. Invoice Generation Service & Object-Level Authorization
  await t.test('5. Invoice Retrieval: Authorized buyer and farmer can view invoice; unauthorized user is rejected', async () => {
    // Buyer can retrieve invoice
    const buyerInvoice = await orderService.getOrderInvoice(placedConsumerOrder._id, consumer._id, 'CONSUMER');
    assert.equal(buyerInvoice.orderId, placedConsumerOrder.orderId);
    assert.equal(buyerInvoice.invoiceNumber, placedConsumerOrder.invoiceNumber);
    assert.equal(buyerInvoice.total, placedConsumerOrder.total);

    // Farmer can retrieve invoice
    const farmerInvoice = await orderService.getOrderInvoice(placedConsumerOrder.orderId, farmer._id, 'FARMER');
    assert.equal(farmerInvoice._id.toString(), placedConsumerOrder._id.toString());

    // Unauthorized user (Business Buyer who did not place this order) must be rejected with 403
    await assert.rejects(
      async () => {
        await orderService.getOrderInvoice(placedConsumerOrder._id, businessUser._id, 'BUSINESS');
      },
      (err) => err.statusCode === 403,
      'Unauthorized user must receive 403 FORBIDDEN when attempting to access another user invoice'
    );
  });

  // 6. Immutability Verification: Profile changes do NOT alter historic order snapshot
  await t.test('6. Snapshot Immutability: Editing buyer or farmer profile does NOT change historical order/invoice', async () => {
    const originalDeliveryAddress = placedConsumerOrder.deliveryAddress.line1;
    const originalInvoiceNumber = placedConsumerOrder.invoiceNumber;
    const originalSellerName = placedConsumerOrder.sellerDetails.fullName;

    // Mutate buyer profile
    await userService.updateUserProfile(consumer._id, {
      fullName: 'Aarav Renamed Consumer',
      phone: '+91 9999999999',
    });

    // Mutate farmer profile
    fProfile.farmName = 'Brand New Modified Farm Name';
    await fProfile.save();

    // Re-fetch order from database
    const freshOrder = await Order.findById(placedConsumerOrder._id);
    assert.equal(freshOrder.invoiceNumber, originalInvoiceNumber, 'Invoice number must remain immutable');
    assert.equal(freshOrder.deliveryAddress.line1, originalDeliveryAddress, 'Delivery address snapshot must remain unchanged');
    assert.equal(freshOrder.sellerDetails.fullName, originalSellerName, 'Seller details snapshot must remain unchanged');
    assert.equal(freshOrder.buyerDetails.fullName, consumer.fullName, 'Historical buyer snapshot must remain intact');
  });

  // 7. Farmer Order Screen Data & Status Progression
  await t.test('7. Farmer Orders: Farmer sees buyer details, distance, financial breakdown, and can view payment proof', async () => {
    const result = await orderService.getOrdersForFarmer(farmer._id, { page: 1, limit: 10 });
    const orderInList = result.orders.find((o) => o._id.toString() === placedConsumerOrder._id.toString());
    assert.ok(orderInList, 'Order must appear in fulfilling farmer orders queue');
    assert.equal(orderInList.buyerDetails.fullName, consumer.fullName);
    assert.equal(orderInList.paymentProofUrl, '/uploads/sample_payment_screenshot_40percent.png');
    assert.ok(orderInList.distanceKm > 0);
    assert.ok(orderInList.advanceAmount > 0);
    assert.ok(orderInList.pendingAmount > 0);

    // Farmer confirms order
    const updated = await orderService.updateOrderStatus({
      orderId: placedConsumerOrder._id,
      status: 'CONFIRMED',
      actorId: farmer._id,
      actorRole: 'FARMER',
    });
    assert.equal(updated.status, 'CONFIRMED');
  });

  await disconnectDB();
});
