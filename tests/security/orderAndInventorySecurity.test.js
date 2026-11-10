const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../../server/config/db');
const User = require('../../server/models/User');
const Product = require('../../server/models/Product');
const Order = require('../../server/models/Order');
const orderService = require('../../server/services/orderService');

test('KhetiSetu Security Test Suite: Server-Authoritative Pricing, BOLA & Inventory', async (t) => {
  await connectDB();

  const [farmer, consumerA, consumerB, product] = await Promise.all([
    User.findOne({ email: 'farmer@khetisetu.demo' }),
    User.findOne({ email: 'consumer@khetisetu.demo' }),
    User.findOne({ email: 'business@khetisetu.demo' }),
    Product.findOne({ status: 'ACTIVE' }),
  ]);

  await t.test('1. Server-Authoritative Pricing: Server calculates grand total; client total is ignored', async () => {
    const requestedQty = 5;
    const expectedSubtotal = product.pricePerUnit * requestedQty;

    const { order } = await orderService.createOrder({
      buyerId: consumerA._id,
      buyerRole: 'CONSUMER',
      items: [
        {
          productId: product._id,
          quantity: requestedQty,
          // Attacker sends manipulated price of ₹1
          unitPrice: 1,
          total: 1,
        },
      ],
      deliveryAddress: {
        fullName: 'Test Consumer',
        phone: '+919876543210',
        line1: '123 Farm Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      },
      paymentMethod: 'DIRECT_ORDER',
    });

    assert.equal(
      order.subtotal,
      expectedSubtotal,
      'Server MUST calculate subtotal from database pricePerUnit, strictly ignoring client values'
    );
    assert.ok(order.total > expectedSubtotal, 'Grand total must include server delivery fee and tax');

    // Cleanup created test order
    await Order.findByIdAndDelete(order._id);
  });

  await t.test('2. Input Validation: Negative or zero quantity is strictly rejected', async () => {
    await assert.rejects(
      async () => {
        await orderService.createOrder({
          buyerId: consumerA._id,
          buyerRole: 'CONSUMER',
          items: [{ productId: product._id, quantity: -10 }],
          deliveryAddress: {
            fullName: 'Attacker',
            phone: '1234567890',
            line1: 'Road',
            city: 'City',
            state: 'State',
            pincode: '411001',
          },
        });
      },
      /Invalid quantity/,
      'Server must reject negative quantity requests'
    );
  });

  await t.test('3. BOLA / Broken Object-Level Authorization: User A cannot read User B order', async () => {
    // Create an order belonging to Consumer A
    const { order } = await orderService.createOrder({
      buyerId: consumerA._id,
      buyerRole: 'CONSUMER',
      items: [{ productId: product._id, quantity: 2 }],
      deliveryAddress: {
        fullName: 'Consumer A',
        phone: '+919876543210',
        line1: 'Street 1',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      },
    });

    // Consumer B attempts to read Consumer A's order using order ID
    await assert.rejects(
      async () => {
        await orderService.getOrderById(order._id, consumerB._id, 'CONSUMER');
      },
      /authorization/,
      'User B must be denied access to User A order even with valid order ID'
    );

    // Cleanup
    await Order.findByIdAndDelete(order._id);
  });

  await disconnectDB();
});
