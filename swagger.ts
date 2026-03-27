import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname);

const PORT = parseInt(process.env.PORT || "5000", 10);
const HOST = process.env.HOST || "localhost";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Elemenopee Backend API",
      version: "1.0.0",
      description:
        "A RESTful API for managing products, orders, and abandoned carts in the Elemenopee project",
      contact: {
        name: "API Support",
        email: "support@elemenopee.com",
      },
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || `http://${HOST}:${PORT}`,
        description: "Primary server",
      },
      {
        url: `http://localhost:${PORT}`,
        description: "Local server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          required: ["firebaseUid"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated unique identifier",
            },
            firebaseUid: {
              type: "string",
              description: "Firebase Authentication UID",
            },
            name: { type: "string", description: "User display name" },
            email: { type: "string", description: "User email" },
            phone: { type: "string", description: "User phone number" },
            gender: { type: "string", enum: ["male", "female", "other"], description: "User gender" },
            pendingLoyalCoin: { type: "number", description: "Pending LoyalCoin awaiting confirmation", default: 0 },
            loyalCoin: { type: "number", description: "LoyalCoin balance", default: 0 },
            orders: {
              type: "array",
              items: { type: "string" },
              description: "Order IDs associated with the user",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          required: ["title", "skuId"],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated unique identifier",
            },
            title: {
              type: "string",
              description: "Product title",
            },
            description: {
              type: "string",
              description: "Product description",
            },
            size: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Available sizes",
            },
            skuId: {
              type: "string",
              description: "Unique SKU identifier",
            },
            price: {
              type: "number",
              description: "Original price",
            },
            discountedPrice: {
              type: "number",
              description: "Discounted price",
            },
            discountPercent: {
              type: "number",
              description: "Discount percentage",
            },
            category: {
              type: "string",
              description: "Product category",
            },
            imageUrl: {
              type: "string",
              description: "Main product image URL",
            },
            images: {
              type: "array",
              items: {
                type: "string",
              },
              description: "All product image URLs",
            },
            variations: {
              type: "string",
              description: "Product variations",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Product tags",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Order: {
          type: "object",
          required: [
            "customerId",
            "customerName",
            "customerEmail",
            "items",
            "subtotal",
            "total",
            "paymentMethod",
          ],
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated unique identifier",
            },
            customerId: {
              type: "string",
              description: "Customer identifier",
            },
            customerName: {
              type: "string",
              description: "Customer full name",
            },
            customerEmail: {
              type: "string",
              description: "Customer email address",
            },
            customerPhone: {
              type: "string",
              description: "Customer phone number",
            },
            shippingAddress: {
              type: "object",
              required: ["street", "city", "state", "zipCode", "country"],
              properties: {
                street: { type: "string", description: "Street address" },
                city: { type: "string", description: "City" },
                state: { type: "string", description: "State/Province" },
                zipCode: { type: "string", description: "ZIP/Postal code" },
                country: { type: "string", description: "Country" },
              },
            },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "title", "skuId", "quantity", "price"],
                properties: {
                  productId: {
                    type: "string",
                    description: "Product reference ID",
                  },
                  title: { type: "string", description: "Product title" },
                  skuId: { type: "string", description: "Product SKU" },
                  quantity: { type: "number", description: "Quantity ordered" },
                  price: { type: "number", description: "Unit price" },
                  discountedPrice: {
                    type: "number",
                    description: "Discounted unit price",
                  },
                  size: { type: "string", description: "Product size" },
                  imageUrl: { type: "string", description: "Product image" },
                },
              },
            },
            subtotal: {
              type: "number",
              description: "Subtotal before tax and shipping",
            },
            tax: {
              type: "number",
              description: "Tax amount",
            },
            shippingCost: {
              type: "number",
              description: "Shipping cost",
            },
            discount: {
              type: "number",
              description: "Discount amount",
            },
            total: {
              type: "number",
              description: "Total amount",
            },
            paymentMethod: {
              type: "string",
              description: "Payment method used",
            },
            paymentStatus: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
              description: "Payment status",
            },
            orderStatus: {
              type: "string",
              enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
              ],
              description: "Order status",
            },
            trackingNumber: {
              type: "string",
              description: "Shipping tracking number",
            },
            notes: {
              type: "string",
              description: "Additional notes",
            },
            estimatedDelivery: {
              type: "string",
              format: "date",
              description: "Estimated delivery date",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        AbandonedCart: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Auto-generated unique identifier",
            },
            customerId: {
              type: "string",
              description: "Customer identifier",
            },
            customerEmail: {
              type: "string",
              description: "Customer email address",
            },
            customerName: {
              type: "string",
              description: "Customer name",
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: {
                    type: "string",
                    description: "Product reference ID",
                  },
                  title: { type: "string", description: "Product title" },
                  skuId: { type: "string", description: "Product SKU" },
                  quantity: { type: "number", description: "Quantity in cart" },
                  price: { type: "number", description: "Unit price" },
                  discountedPrice: {
                    type: "number",
                    description: "Discounted unit price",
                  },
                  size: { type: "string", description: "Product size" },
                  imageUrl: { type: "string", description: "Product image" },
                },
              },
            },
            subtotal: {
              type: "number",
              description: "Subtotal amount",
            },
            total: {
              type: "number",
              description: "Total amount",
            },
            abandonedAt: {
              type: "string",
              format: "date-time",
              description: "When cart was abandoned",
            },
            lastActivity: {
              type: "string",
              format: "date-time",
              description: "Last activity timestamp",
            },
            recoveryAttempts: {
              type: "number",
              description: "Number of recovery attempts",
            },
            recovered: {
              type: "boolean",
              description: "Whether cart was recovered",
            },
            recoveryDate: {
              type: "string",
              format: "date-time",
              description: "Date when cart was recovered",
            },
            notes: {
              type: "string",
              description: "Additional notes",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
      },
    },
  },
  apis: [
    path.resolve(ROOT_DIR, "routes/*.ts"),
    path.resolve(ROOT_DIR, "controllers/**/*.ts"),
    path.resolve(ROOT_DIR, "server.ts"),
  ],
};

export const specs = swaggerJsdoc(options);
