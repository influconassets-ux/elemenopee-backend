import { z } from 'zod';
import { 
  ObjectIdSchema, 
  PaginationQuerySchema, 
  OrderItemSchema, 
  ShippingAddressSchema,
  PaymentStatusEnum,
  OrderStatusEnum
} from '../common/schemas.js';

// Order schemas
export const OrderCreateSchema = z.object({
  user: ObjectIdSchema.optional(),
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email format').optional(),
  customerPhone: z.string().optional(),
  shippingAddress: ShippingAddressSchema,
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  tax: z.number().min(0, 'Tax must be non-negative').default(0).optional(),
  shippingCost: z.number().min(0, 'Shipping cost must be non-negative').default(0).optional(),
  discount: z.number().min(0, 'Discount must be non-negative').default(0).optional(),
  total: z.number().min(0, 'Total must be non-negative'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentStatus: PaymentStatusEnum.default('pending').optional(),
  orderStatus: OrderStatusEnum.default('pending').optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  estimatedDelivery: z.string().datetime('Invalid date format').optional()
});

export const OrderUpdateSchema = OrderCreateSchema.partial();

export const OrderParamsSchema = z.object({
  id: ObjectIdSchema
});

export const OrderQuerySchema = PaginationQuerySchema.extend({
  status: OrderStatusEnum.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  customerId: z.string().optional()
});

// Export all schemas
export const OrderSchemas = {
  create: OrderCreateSchema,
  update: OrderUpdateSchema,
  params: OrderParamsSchema,
  query: OrderQuerySchema
} as const;

// Type exports
export type OrderCreateInput = z.infer<typeof OrderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof OrderUpdateSchema>;
export type OrderParamsInput = z.infer<typeof OrderParamsSchema>;
export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;
