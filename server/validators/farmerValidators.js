const { z } = require('zod');

const createBatchSchema = z.object({
  cropName: z.string().min(2, 'Crop name is required').max(60),
  quantity: z.number().positive('Quantity must be greater than zero'),
  unit: z.enum(['kg', 'quintal', 'ton', 'box', 'crate']).default('kg'),
  harvestDate: z.string().or(z.date()).optional(),
  shelfLifeDays: z.number().int().positive().optional(),
  storageInformation: z
    .object({
      method: z.string().optional(),
      location: z.string().optional(),
      humidityControl: z.boolean().optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

const createListingSchema = z.object({
  batchId: z.string().min(10, 'Valid batch ID is required'),
  title: z.string().min(3, 'Title is required').max(140).optional(),
  description: z.string().max(2000).optional(),
  pricePerUnit: z.number().positive('Price must be greater than zero in INR'),
  availableQuantity: z.number().positive('Available quantity must be positive'),
  minOrderQuantity: z.number().int().positive().default(1),
  maxOrderQuantity: z.number().int().positive().optional(),
  isB2C: z.boolean().default(true),
  isB2B: z.boolean().default(false),
  images: z.array(z.string()).optional(),
});

module.exports = {
  createBatchSchema,
  createListingSchema,
};
