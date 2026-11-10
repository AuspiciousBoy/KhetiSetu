const { z } = require('zod');

// Password strength: min 8 chars, uppercase, lowercase, number, special char
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Standard Indian GSTIN: 15 alphanumeric characters (2 state digits, 5 PAN letters, 4 PAN numbers, 1 PAN letter, 1 entity code, 'Z', 1 checksum)
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address').max(100),
    password: passwordSchema,
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    phone: z
      .string()
      .trim()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15)
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
    role: z.enum(['FARMER', 'CONSUMER', 'BUSINESS']).default('CONSUMER'),
    profileData: z.record(z.any()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'BUSINESS') {
      const rawGst = data.profileData?.gstNumber ? String(data.profileData.gstNumber).trim().toUpperCase() : '';
      if (!rawGst) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['profileData', 'gstNumber'],
          message: 'GSTIN is compulsory for business accounts.',
        });
      } else if (!GSTIN_REGEX.test(rawGst)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['profileData', 'gstNumber'],
          message: 'Invalid GSTIN format. Expected 15-character Indian GSTIN (e.g. 27AAPFU0939F1ZV).',
        });
      }
    }
  });

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  newPassword: passwordSchema,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
