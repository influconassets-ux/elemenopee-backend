import { z } from 'zod';
import { ObjectIdSchema } from '../common/schemas.js';

// User schemas
export const UserSyncSchema = z.object({
  firebaseUid: z.string().min(1, 'firebaseUid is required'),
  name: z.string().optional(),
  email: z.string().email('Invalid email format').nullish().optional(),
  phone: z.string().nullish().optional(),
  gender: z.enum(['male', 'female', 'other']).optional()
});

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const UserRegisterSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'user']).optional()
});

export const UserUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional()
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const UserParamsSchema = z.object({
  id: ObjectIdSchema
});

// Export all schemas
export const UserSchemas = {
  sync: UserSyncSchema,
  login: UserLoginSchema,
  register: UserRegisterSchema,
  params: UserParamsSchema,
  update: UserUpdateSchema
} as const;

// Type exports
export type UserSyncInput = z.infer<typeof UserSyncSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
export type UserParamsInput = z.infer<typeof UserParamsSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
