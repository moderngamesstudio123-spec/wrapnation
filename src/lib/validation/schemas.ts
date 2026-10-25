import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  totpCode: z.string().trim().regex(/^\d{6}$/, 'TOTP code must be 6 digits').optional(),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).strict().refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string().uuid('Invalid menu item ID'),
  variantId: z.string().uuid('Invalid variant ID').optional().nullable(),
  addOnIds: z.array(z.string().uuid()).default([]),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Max 50 per item'),
}).strict();

export const createOrderSchema = z.object({
  type: z.enum(['DINE_IN', 'TAKEAWAY']),
  tableToken: z.string().optional().nullable(),
  customerName: z.string().trim().max(50, 'Name max 50 chars').optional().nullable(),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')
    .optional()
    .nullable(),
  whatsappOptIn: z.boolean().default(false),
  cookingNote: z.string().trim().max(200, 'Cooking note max 200 characters').optional().nullable(),
  paymentMethod: z.enum(['UPI', 'CASH']).default('UPI'),
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one item').max(30, 'Max 30 items per order'),
}).strict().refine((data) => {
  if (data.type === 'DINE_IN' && !data.tableToken) {
    return false;
  }
  if (data.type === 'TAKEAWAY' && (!data.customerPhone || !data.customerName)) {
    return false;
  }
  return true;
}, {
  message: 'Missing required fields for selected order type (Dine-in requires table token; Takeaway requires name & 10-digit phone)',
});

export const markPaidSchema = z.object({
  method: z.enum(['UPI', 'CASH']),
  utr: z
    .string()
    .trim()
    .min(4, 'UTR must be at least 4 characters')
    .max(40, 'UTR max 40 characters')
    .optional()
    .nullable(),
  notes: z.string().trim().max(200).optional().nullable(),
}).strict();

export const customerUtrHintSchema = z.object({
  last4Digits: z.string().trim().regex(/^\d{4}$/, 'Must be exactly 4 digits'),
}).strict();

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'AWAITING_PAYMENT',
    'PAID',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED',
  ]),
}).strict();

export const menuItemInputSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2, 'Name min 2 chars').max(80, 'Name max 80 chars'),
  description: z.string().trim().max(250).optional().nullable(),
  basePriceRupees: z.number().min(0, 'Price must be >= 0'),
  isVeg: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  variants: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        priceDeltaRupees: z.number(),
        isDefault: z.boolean().default(false),
      })
    )
    .optional()
    .default([]),
  addOnIds: z.array(z.string().uuid()).optional().default([]),
}).strict();

export const updateUpiSettingsSchema = z.object({
  currentPassword: z.string().min(1, 'Owner password verification is required'),
  upiId: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, 'Invalid UPI VPA (e.g. shop@okaxis)'),
  payeeName: z.string().trim().min(2, 'Payee name min 2 chars').max(100),
  qrImageUrl: z.string().optional().nullable(),
}).strict();

export const updateShopSettingsSchema = z.object({
  shopName: z.string().trim().min(2).max(100),
  shopAddress: z.string().trim().max(250),
  shopPhone: z.string().trim().max(20),
  gstEnabled: z.boolean(),
  gstin: z.string().trim().max(20).optional().nullable(),
  gstPercentage: z.number().min(0).max(28),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/),
  tablesCount: z.number().int().min(1).max(100),
  unpaidOrderTimeoutMins: z.number().int().min(5).max(60),
  printerPaperWidth: z.enum(['80', '58']),
  printerEnabled: z.boolean(),
}).strict();
