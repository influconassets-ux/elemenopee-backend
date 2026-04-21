import { z } from 'zod';
import { ObjectIdSchema, PaginationQuerySchema } from '../common/schemas.js';

// Product schemas
export const ProductCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  size: z.array(z.string()).optional(),
  skuId: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative').optional(),
  discountedPrice: z.number().min(0, 'Discounted price must be non-negative').optional(),
  discountPercent: z.number().min(0).max(100, 'Discount percentage must be between 0 and 100').optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  gender: z.string().optional(),
  ageGroup: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL').or(z.string().startsWith('/')).or(z.literal('')).optional(),
  images: z.array(z.string().url().or(z.string().startsWith('/')).or(z.literal('')).or(z.null())).optional(),
  variations: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fabric: z.string().optional(),
  material: z.string().optional(),
  washCare: z.string().optional(),
  whatsIncluded: z.string().optional(),
  styleCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  sizeRange: z.string().optional(),
  fitType: z.string().optional(),
  length: z.string().optional(),
  topLength: z.string().optional(),
  chestWidth: z.string().optional(),
  chestWaist: z.string().optional(),
  shoulderWidth: z.string().optional(),
  bottomLength: z.string().optional(),
  bottomWaist: z.string().optional(),
  hip: z.string().optional(),
  sleeveLength: z.string().optional(),
  neckType: z.string().optional(),
  closureType: z.string().optional(),
  fabricComposition: z.string().optional(),
  fabricType: z.string().optional(),
  gsm: z.string().optional(),
  breathability: z.string().optional(),
  softness: z.string().optional(),
  skinFriendly: z.string().optional(),
  seasonSuitability: z.string().optional(),
  transparent: z.string().optional(),
  patternPrint: z.string().optional(),
  printPlacement: z.string().optional(),
  printTechnique: z.string().optional(),
  occasion: z.string().optional(),
  theme: z.string().optional(),
  variants: z.array(z.object({
    size: z.string().optional(),
    skuId: z.string().optional(),
    inventory: z.number().optional()
  })).optional(),
  inventory: z.number().min(0).optional()
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
