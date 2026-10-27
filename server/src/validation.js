import { z } from 'zod';

const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase());
const passwordSchema = z.string().min(8).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: passwordSchema,
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
}).strict();

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
}).strict();

export const passwordResetSchema = z.object({
  token: z.string().min(32).max(128),
  password: passwordSchema,
}).strict();

export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1).max(64),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(50),
  delivery: z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(1).max(40),
    address: z.string().trim().min(1).max(300),
    city: z.string().trim().min(1).max(100),
  }).strict(),
  paymentMethod: z.enum(['Cash on delivery', 'Mobile money (demo)']),
}).strict();

export const deliveryMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
}).strict();

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254).optional(),
}).strict();
