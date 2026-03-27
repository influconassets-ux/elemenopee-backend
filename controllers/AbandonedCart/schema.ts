import { z } from 'zod';
import { ObjectIdSchema, PaginationQuerySchema, OrderItemSchema } from '../common/schemas.js';

// Abandoned Cart schemas
export const AbandonedCartCreateSchema = z.object({
  customerId: z.string().optional(),
  customerEmail: z.string().email('Invalid email format').optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative').default(0),
  total: z.number().min(0, 'Total must be non-negative').default(0),
  abandonedAt: z.string().datetime('Invalid date format').optional(),
  lastActivity: z.string().datetime('Invalid date format').optional(),
  recoveryAttempts: z.number().int().min(0).default(0),
  recovered: z.boolean().default(false),
  recoveryDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().optional()
});

export const AbandonedCartUpdateSchema = AbandonedCartCreateSchema.partial();

export const AbandonedCartParamsSchema = z.object({
  id: ObjectIdSchema
});

// Export all schemas
export const AbandonedCartSchemas = {
  create: AbandonedCartCreateSchema,
  update: AbandonedCartUpdateSchema,
  params: AbandonedCartParamsSchema,
  query: PaginationQuerySchema
} as const;

// Type exports
export type AbandonedCartCreateInput = z.infer<typeof AbandonedCartCreateSchema>;
export type AbandonedCartUpdateInput = z.infer<typeof AbandonedCartUpdateSchema>;
export type AbandonedCartParamsInput = z.infer<typeof AbandonedCartParamsSchema>;
export type AbandonedCartQueryInput = z.infer<typeof PaginationQuerySchema>;
