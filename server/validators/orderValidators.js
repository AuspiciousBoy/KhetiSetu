const { z } = require('zod');

const orderItemSchema = z.object({
  productId: z.string().min(10, 'Valid product ID is required'),
  quantity: z.number().int().positive('Quantity must be an integer greater than 0'),
});

const deliveryAddressSchema = z.object({
  fullName: z.string().min(2, 'Recipient full name is required'),
  phone: z.string().min(10, 'Recipient contact phone is required'),
  line1: z.string().min(3, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  district: z.string().optional(),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Valid 6-digit PIN code is required'),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  deliveryAddress: deliveryAddressSchema,
  paymentMethod: z.enum(['UPI', 'NET_BANKING', 'CARD', 'CASH_ON_DELIVERY']).default('UPI'),
  idempotencyKey: z.string().max(100).optional(),
});

module.exports = {
  createOrderSchema,
};
