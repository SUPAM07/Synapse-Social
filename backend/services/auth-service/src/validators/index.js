import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'password must be at least 6 characters'),
  role: z.enum(['customer', 'organizer', 'admin']).optional().default('customer'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});
