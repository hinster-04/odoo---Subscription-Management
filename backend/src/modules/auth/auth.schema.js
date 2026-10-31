const { z } = require('zod');

/**
 * registerSchema
 *
 * Validates and sanitizes the customer registration request body.
 *
 * Security invariants enforced here:
 *   - `role` is NEVER accepted from the request — silently stripped if present.
 *   - `is_active` is NEVER accepted from the request — silently stripped.
 *   - `email_verified` is NEVER accepted from the request — silently stripped.
 *   - `password_hash` is NEVER accepted from the request — silently stripped.
 *
 * All stripping happens via .strip() (Zod default) — unknown keys are removed
 * automatically before the data reaches the service layer.
 */
const registerSchema = z.object({
  // ── Required ──────────────────────────────────────────────────────────────
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Must be a valid email address')
    .max(255, 'Email must not exceed 255 characters'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must not exceed 72 characters')
    .refine((val) => Buffer.byteLength(val, 'utf8') <= 72, {
      message: 'Password must not exceed 72 bytes in UTF-8 encoding',
    })
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  first_name: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters'),

  // ── Optional ──────────────────────────────────────────────────────────────
  last_name: z
    .string()
    .trim()
    .max(100, 'Last name must not exceed 100 characters')
    .optional(),

  business_name: z
    .string()
    .trim()
    .max(200, 'Business name must not exceed 200 characters')
    .optional(),

  business_type: z
    .string()
    .trim()
    .max(100, 'Business type must not exceed 100 characters')
    .optional(),

  phone: z
    .string()
    .trim()
    .max(20, 'Phone must not exceed 20 characters')
    .optional(),

  address: z
    .string()
    .trim()
    .optional(),

  city: z
    .string()
    .trim()
    .max(100, 'City must not exceed 100 characters')
    .optional(),

  state: z
    .string()
    .trim()
    .max(100, 'State must not exceed 100 characters')
    .optional(),

  country: z
    .string()
    .trim()
    .max(100, 'Country must not exceed 100 characters')
    .optional(),

  postal_code: z
    .string()
    .trim()
    .max(20, 'Postal code must not exceed 20 characters')
    .optional(),
});

/**
 * loginSchema
 *
 * Validates and normalizes login credentials.
 * Strips any extra/injected fields (e.g., role, is_active, auth_id).
 */
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Must be a valid email address')
    .max(255, 'Email must not exceed 255 characters'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(72, 'Password must not exceed 72 characters')
    .refine((val) => Buffer.byteLength(val, 'utf8') <= 72, {
      message: 'Password must not exceed 72 bytes in UTF-8 encoding',
    }),
});

module.exports = { registerSchema, loginSchema };
