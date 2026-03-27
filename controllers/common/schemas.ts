import { z } from "zod";

// Common schemas that can be shared across controllers
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Pagination query schema
export const PaginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// Order item schema (shared between Order and AbandonedCart)
export const OrderItemSchema = z.object({
  productId: z.union([ObjectIdSchema, z.string()]),
  title: z.string().min(1, "Product title is required"),
  skuId: z.string().min(1, "SKU ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be non-negative"),
  discountedPrice: z
    .number()
    .min(0, "Discounted price must be non-negative")
    .optional(),
  size: z.string().optional(),
  imageUrl: z
    .string()
    .refine((val) => val.startsWith("/") || /^https?:\/\//.test(val), {
      message: "Must be a relative or absolute URL",
    })
    .optional(),
});

// Shipping address schema
export const ShippingAddressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  landmark: z.string().optional(),
});

// Common status enums
export const PaymentStatusEnum = z.enum([
  "pending",
  "paid",
  "failed",
  "refunded",
]);
export const OrderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const SortOrderEnum = z.enum(["asc", "desc"]);
