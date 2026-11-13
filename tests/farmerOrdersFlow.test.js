const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../server/config/db');
const User = require('../server/models/User');
const Product = require('../server/models/Product');
const ProduceBatch = require('../server/models/ProduceBatch');
const BusinessProfile = require('../server/models/BusinessProfile');
const Order = require('../server/models/Order');
const Delivery = require('../server/models/Delivery');
const orderService = require('../server/services/orderService');

test('KhetiSetu Farmer Orders & Dispatch Verification Suite', async (t) => {
  await connectDB();

  // Load existing seeded users and products
  const [farmerA, consumer, businessUser, product] = await Promise.all([
    User.findOne({ email: 'farmer@khetisetu.demo' }),
    User.findOne({ email: 'consumer@khetisetu.demo' }),
    User.findOne({ email: 'business@khetisetu.demo' }),
    Product.findOne({ status: 'ACTIVE' }),
  ]);

  assert.ok(farmerA, 'Farmer A must exist in test environment');
  assert.ok(consumer, 'Consumer must exist in test environment');
  assert.ok(businessUser, 'Business User must exist in test environment');
  assert.ok(product, 'Active Product must exist in test environment');

  // Create temporary Farmer B for isolation tests
  let farmerB = await User.findOne({ email: 'farmer_b_isolation@khetisetu.test' });
  if (!farmerB) {
    farmerB = await User.create({
      email: 'farmer_b_isolation@khetisetu.test',
      passwordHash: 'argon2id_dummy_hash_for_test',
      fullName: 'Vitthalrao Shinde',
      role: 'FARMER',
      isEmailVerified: true,
    });
  }

  let consumerOrderId = null;
  let b2bOrderId = null;

  await t.test('1. Consumer Order Flow: Consumer places order for Farmer A produce -> appears in Farmer A orders', async () => {
    const { order } = await orderService.createOrder({
      buyerId: consumer._id,
      buyerRole: 'CONSUMER',
      items: [
        {
          productId: product._id,
          quantity: 2,
        },
      ],
      deliveryAddress: {
        fullName: 'Aarav Mehta',
        phone: '+919876543210',
        line1: 'Flat 402, Green Meadows',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
      },
      paymentMethod: 'DIRECT_ORDER',
    });

    consumerOrderId = order._id;
    assert.ok(order, 'Order created successfully');
    assert.equal(order.status, 'PLACED');

    // Query orders for Farmer A
    const farmerOrdersResult = await orderService.getOrdersForFarmer(farmerA._id, { page: 1, limit: 10 });
    const foundOrder = farmerOrdersResult.orders.find((o) => o._id.toString() === order._id.toString());

    assert.ok(foundOrder, 'Order placed by consumer MUST appear in Farmer A fulfillment orders');
    assert.equal(foundOrder.buyerRole, 'CONSUMER');
    assert.equal(foundOrder.deliveryAddress.fullName, 'Aarav Mehta');
    assert.equal(foundOrder.deliveryAddress.city, 'Pune');
    assert.ok(foundOrder.items.length > 0, 'Order items must be populated');
  });

  await t.test('2. B2B Wholesale Order Flow: B2B buyer places order -> appears in Farmer A orders with business details', async () => {
    // Ensure business profile exists for businessUser
    await BusinessProfile.findOneAndUpdate(
      { userId: businessUser._id },
      {
        businessName: 'Sahyadri Agro Wholesalers Ltd',
        businessType: 'WHOLESALER',
        gstNumber: '27AAAAA0000A1Z5',
      },
      { upsert: true }
    );

    const { order } = await orderService.createOrder({
      buyerId: businessUser._id,
      buyerRole: 'BUSINESS',
      items: [
        {
          productId: product._id,
          quantity: 5,
        },
      ],
      deliveryAddress: {
        fullName: 'Rajesh Agrawal',
        phone: '+919123456789',
        line1: 'Warehouse 12, APMC Market Yard',
        city: 'Mumbai',
        district: 'Mumbai Suburb',
        state: 'Maharashtra',
        pincode: '400705',
      },
      paymentMethod: 'DIRECT_ORDER',
    });

    b2bOrderId = order._id;
    assert.ok(order, 'B2B order created successfully');

    // Query orders for Farmer A
    const farmerOrdersResult = await orderService.getOrdersForFarmer(farmerA._id, { page: 1, limit: 10 });
    const foundOrder = farmerOrdersResult.orders.find((o) => o._id.toString() === order._id.toString());

    assert.ok(foundOrder, 'B2B order MUST appear in Farmer A orders list');
    assert.equal(foundOrder.buyerRole, 'BUSINESS');
    assert.ok(foundOrder.businessProfile, 'Business profile must be populated for B2B orders');
    assert.equal(foundOrder.businessProfile.businessName, 'Sahyadri Agro Wholesalers Ltd');
    assert.equal(foundOrder.businessProfile.gstNumber, '27AAAAA0000A1Z5');
  });

  await t.test('3. Multi-Farmer Isolation: Farmer B CANNOT see Farmer A orders', async () => {
    const farmerBOrdersResult = await orderService.getOrdersForFarmer(farmerB._id, { page: 1, limit: 10 });
    const hasFarmerAOrder = farmerBOrdersResult.orders.some(
      (o) => o._id.toString() === consumerOrderId.toString() || o._id.toString() === b2bOrderId.toString()
    );

    assert.equal(hasFarmerAOrder, false, 'Farmer B must NOT be able to view orders belonging to Farmer A');
  });

  await t.test('4. Status Progression & Dispatch: Farmer A transitions order PLACED -> CONFIRMED -> PACKED -> OUT_FOR_DELIVERY -> DELIVERED', async () => {
    // Transition to CONFIRMED
    const confirmedOrder = await orderService.updateOrderStatus({
      orderId: consumerOrderId,
      status: 'CONFIRMED',
      note: 'Order accepted by grower',
      actorId: farmerA._id,
      actorRole: 'FARMER',
    });
    assert.equal(confirmedOrder.status, 'CONFIRMED');

    // Verify Delivery is synced in MongoDB
    const deliveryAfterConfirm = await Delivery.findOne({ orderId: consumerOrderId });
    assert.equal(deliveryAfterConfirm.status, 'CONFIRMED');

    // Transition to PACKED
    const packedOrder = await orderService.updateOrderStatus({
      orderId: consumerOrderId,
      status: 'PACKED',
      note: 'Produce crates packed & graded',
      actorId: farmerA._id,
      actorRole: 'FARMER',
    });
    assert.equal(packedOrder.status, 'PACKED');

    // Transition to OUT_FOR_DELIVERY (Dispatch)
    const dispatchedOrder = await orderService.updateOrderStatus({
      orderId: consumerOrderId,
      status: 'OUT_FOR_DELIVERY',
      location: 'Pune Central Cold Hub',
      note: 'Dispatched via refrigerated truck MH-12-AB-1234',
      actorId: farmerA._id,
      actorRole: 'FARMER',
    });
    assert.equal(dispatchedOrder.status, 'OUT_FOR_DELIVERY');

    // Verify delivery tracking events recorded
    const deliveryAfterDispatch = await Delivery.findOne({ orderId: consumerOrderId });
    assert.equal(deliveryAfterDispatch.status, 'OUT_FOR_DELIVERY');
    const latestEvent = deliveryAfterDispatch.trackingEvents[deliveryAfterDispatch.trackingEvents.length - 1];
    assert.equal(latestEvent.status, 'OUT_FOR_DELIVERY');
    assert.equal(latestEvent.location, 'Pune Central Cold Hub');

    // Transition to DELIVERED
    const deliveredOrder = await orderService.updateOrderStatus({
      orderId: consumerOrderId,
      status: 'DELIVERED',
      note: 'Delivered to recipient',
      actorId: farmerA._id,
      actorRole: 'FARMER',
    });
    assert.equal(deliveredOrder.status, 'DELIVERED');

    const finalDelivery = await Delivery.findOne({ orderId: consumerOrderId });
    assert.equal(finalDelivery.status, 'DELIVERED');
    assert.ok(finalDelivery.actualDeliveryDate, 'actualDeliveryDate must be recorded on delivery');
  });

  await t.test('5. Unauthorized Status Update Prevention: Farmer B CANNOT modify Farmer A order', async () => {
    await assert.rejects(
      async () => {
        await orderService.updateOrderStatus({
          orderId: consumerOrderId,
          status: 'CANCELLED',
          actorId: farmerB._id,
          actorRole: 'FARMER',
        });
      },
      /authorization/i,
      'Farmer B modifying Farmer A order must be strictly rejected with 403 Forbidden'
    );
  });

  // Clean up test records
  await Promise.all([
    Order.deleteMany({ _id: { $in: [consumerOrderId, b2bOrderId] } }),
    Delivery.deleteMany({ orderId: { $in: [consumerOrderId, b2bOrderId] } }),
    User.deleteOne({ _id: farmerB._id }),
  ]);

  await disconnectDB();
});
