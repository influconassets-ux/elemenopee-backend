import { z } from 'zod';
import { ObjectIdSchema, PaginationQuerySchema } from '../common/schemas.js';

// Product schemas
export const ProductCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  size: z.array(z.string()).optional(),
  skuId: z.string().min(1, 'SKU ID is required'),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  discountedPrice: z.number().min(0, 'Discounted price must be non-negative').optional(),
  discountPercent: z.number().min(0).max(100, 'Discount percentage must be between 0 and 100').optional(),
  category: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').or(z.string().startsWith('/')).or(z.literal('')).optional(),
  images: z.array(z.string().url().or(z.string().startsWith('/')).or(z.literal('')).or(z.null())).optional(),
  variations: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductParamsSchema = z.object({
  id: ObjectIdSchema
});

export const ProductQuerySchema = PaginationQuerySchema.extend({
  category: z.string().optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  search: z.string().optional()
});

// Export all schemas
export const ProductSchemas = {
  create: ProductCreateSchema,
  update: ProductUpdateSchema,
  params: ProductParamsSchema,
  query: ProductQuerySchema
} as const;

// Type exports
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
export type ProductParamsInput = z.infer<typeof ProductParamsSchema>;
export type ProductQueryInput = z.infer<typeof ProductQuerySchema>;
