# Zod Validation System for Elemenopee Backend

This document explains how to use the Zod validation system implemented in the controllers.

## Overview

The validation system consists of multiple components:
1. **`controllers/common/schemas.ts`** - Contains shared schemas used across multiple controllers
2. **`controllers/{ControllerName}/schema.ts`** - Contains schemas specific to each controller
3. **`utils/validation.ts`** - Contains validation middleware functions

## Schema Organization

### Common Schemas (`controllers/common/schemas.ts`)
- `ObjectIdSchema` - For MongoDB ObjectId validation
- `PaginationQuerySchema` - For pagination parameters (page, limit, sortBy, sortOrder)
- `OrderItemSchema` - Shared between Order and AbandonedCart controllers
- `ShippingAddressSchema` - For shipping address validation
- `PaymentStatusEnum` - Payment status values
- `OrderStatusEnum` - Order status values
- `SortOrderEnum` - Sort order values

### Controller-Specific Schemas

#### User Controller (`controllers/User/schema.ts`)
- `UserSyncSchema` - For user synchronization endpoint
- `UserParamsSchema` - For user ID parameters
- `UserSchemas` - Object containing all user schemas

#### Product Controller (`controllers/Product/schema.ts`)
- `ProductCreateSchema` - For creating new products
- `ProductUpdateSchema` - For updating existing products
- `ProductParamsSchema` - For product ID parameters
- `ProductQuerySchema` - For product query parameters (pagination, filtering)
- `ProductSchemas` - Object containing all product schemas

#### Order Controller (`controllers/Order/schema.ts`)
- `OrderCreateSchema` - For creating new orders
- `OrderUpdateSchema` - For updating existing orders
- `OrderParamsSchema` - For order ID parameters
- `OrderQuerySchema` - For order query parameters (status, payment status, etc.)
- `OrderSchemas` - Object containing all order schemas

#### AbandonedCart Controller (`controllers/AbandonedCart/schema.ts`)
- `AbandonedCartCreateSchema` - For creating abandoned cart entries
- `AbandonedCartUpdateSchema` - For updating abandoned cart entries
- `AbandonedCartParamsSchema` - For abandoned cart ID parameters
- `AbandonedCartSchemas` - Object containing all abandoned cart schemas

## Validation Middleware Functions

### `validateBody(schema)`
Validates request body against a Zod schema.

### `validateQuery(schema)`
Validates query parameters against a Zod schema.

### `validateParams(schema)`
Validates URL parameters against a Zod schema.

### `validateRequest(schemas)`
Combined validation for body, query, and params. Accepts an object with optional `body`, `query`, and `params` properties.

## Usage Examples

### Basic Route with Body Validation
```typescript
import { ProductSchemas } from './controllers/Product/schema.js';

router.post("/", 
  validateRequest({ body: ProductSchemas.create }), 
  async (req, res) => {
    // req.body is now validated and typed as ProductCreateInput
    const product = new Product(req.body);
    // ... rest of the logic
  }
);
```

### Route with Multiple Validations
```typescript
import { OrderSchemas } from './controllers/Order/schema.js';

router.put("/:id", 
  validateRequest({ 
    params: OrderSchemas.params, 
    body: OrderSchemas.update 
  }), 
  async (req, res) => {
    // Both req.params.id and req.body are validated
    const order = await Order.findByIdAndUpdate(req.params.id, req.body);
    // ... rest of the logic
  }
);
```

### Route with Query Validation
```typescript
import { ProductSchemas } from './controllers/Product/schema.js';

router.get("/", 
  validateRequest({ query: ProductSchemas.query }), 
  async (req, res) => {
    // req.query is validated and includes pagination, filtering options
    const { page, limit, category, minPrice, maxPrice } = req.query;
    // ... rest of the logic
  }
);
```

## Error Handling

When validation fails, the middleware automatically returns a 400 status with detailed error information:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "customerName",
      "message": "Customer name is required"
    },
    {
      "field": "items.0.quantity",
      "message": "Quantity must be at least 1"
    }
  ]
}
```

## Type Safety

The schemas provide TypeScript types that can be imported and used:

```typescript
import { OrderCreateInput, ProductCreateInput } from './controllers/Order/schema.js';
import { ProductCreateInput } from './controllers/Product/schema.js';

// These types are automatically inferred from the Zod schemas
function processOrder(orderData: OrderCreateInput) {
  // orderData is fully typed based on the schema
}
```

## Adding New Schemas

To add a new schema:

1. **For controller-specific schemas**: Add them to the appropriate `controllers/{ControllerName}/schema.ts` file
2. **For shared schemas**: Add them to `controllers/common/schemas.ts`
3. **For new controllers**: Create a new `controllers/{NewController}/schema.ts` file
4. Export the schemas in a `{ControllerName}Schemas` object
5. Export the corresponding TypeScript types
6. Use them in your controller with the validation middleware

## Benefits

- **Modular Organization**: Each controller has its own schema file for better organization
- **Shared Schemas**: Common schemas are centralized and reusable
- **Runtime Validation**: Ensures data integrity at the API level
- **Type Safety**: Provides TypeScript types for all validated data
- **Consistent Error Handling**: Standardized validation error responses
- **Maintainable**: Easy to find and update schemas for specific controllers
- **Performance**: Early validation prevents invalid data from reaching business logic

## Testing

You can test the validation by sending invalid data to any endpoint. The system will return detailed validation errors that help identify exactly what's wrong with the request.

## File Structure

```
controllers/
├── common/
│   └── schemas.ts          # Shared schemas
├── User/
│   ├── schema.ts           # User-specific schemas
│   └── route.ts            # User routes with validation
├── Product/
│   ├── schema.ts           # Product-specific schemas
│   └── route.ts            # Product routes with validation
├── Order/
│   ├── schema.ts           # Order-specific schemas
│   └── route.ts            # Order routes with validation
└── AbandonedCart/
    ├── schema.ts           # AbandonedCart-specific schemas
    └── route.ts            # AbandonedCart routes with validation
```
