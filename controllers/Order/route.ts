import express from "express";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import { validateRequest } from "../../utils/validation.js";
import { OrderSchemas } from "./schema.js";
import { authenticate, type AuthenticatedRequest } from "../User/auth.js";
import XLSX from "xlsx";

const router: express.Router = express.Router();

// Allow ALL CRUD access to orders without authentication when coming from the dashboard domain
const DASHBOARD_ORIGINS = [
  "https://elemenopee-dashboard.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175"
];
const conditionalAuthenticate: express.RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  const authHeader = req.header("Authorization");
  console.log(`[Order Auth] Origin: ${origin}, URL: ${req.url}`);

  // If there's an auth header, ALWAYS try to authenticate to catch the user info
  if (authHeader && authHeader.startsWith("Bearer ")) {
    console.log(`[Order Auth] Found Bearer token, attempting full authentication.`);
    return authenticate(req as any, res as any, next as any);
  }

  if (origin && DASHBOARD_ORIGINS.includes(origin)) {
    console.log(`[Order Auth] Bypassing auth for allowed origin: ${origin}`);
    return next();
  }

  // Fallback for local development
  if (origin && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))) {
    console.log(`[Order Auth] Bypassing auth for dev localhost origin: ${origin}`);
    return next();
  }

  console.log(`[Order Auth] Falling back to JWT authentication. Origin was: ${origin}`);
  return authenticate(req as any, res as any, next as any);
};

router.get(
  "/",
  conditionalAuthenticate,
  validateRequest({ query: OrderSchemas.query }),
  async (req, res) => {
    try {
      const orders = await Order.find({ isDeleted: { $ne: true } });
      res.json(orders);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.get(
  "/stats",
  conditionalAuthenticate,
  async (req, res) => {
    console.log(`[Stats Endpoint] Hit by origin: ${req.headers.origin}`);
    try {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const SALE_FILTER = {
        isDeleted: { $ne: true },
        $or: [
          { paymentStatus: "paid" }, // Any paid order is a sale
          { paymentMethod: "COD", orderStatus: { $ne: "pending" } } // COD is only a sale once confirmed (not just pending)
        ],
        orderStatus: { $nin: ["cancelled", "refunded"] },
        paymentStatus: { $nin: ["failed", "refunded"] }
      };

      const [daily, weekly, monthly, yearly, allOrders] = await Promise.all([
        Order.aggregate([
          { $match: { ...SALE_FILTER, createdAt: { $gte: startOfDay } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { ...SALE_FILTER, createdAt: { $gte: startOfWeek } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { ...SALE_FILTER, createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { ...SALE_FILTER, createdAt: { $gte: startOfYear } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Order.find({ ...SALE_FILTER }).sort({ createdAt: -1 }).limit(10)
      ]);

      // Last 30 days breakdown
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dailyBreakdown = await Order.aggregate([
        { $match: { ...SALE_FILTER, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$total" },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      res.json({
        daily: daily[0] || { total: 0, count: 0 },
        weekly: weekly[0] || { total: 0, count: 0 },
        monthly: monthly[0] || { total: 0, count: 0 },
        yearly: yearly[0] || { total: 0, count: 0 },
        recentOrders: allOrders,
        dailyBreakdown
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.get(
  "/export",
  conditionalAuthenticate,
  async (req, res) => {
    try {
      const SALE_FILTER = {
        isDeleted: { $ne: true },
        $or: [
          { paymentStatus: "paid" },
          { paymentMethod: "COD", orderStatus: { $ne: "pending" } }
        ],
        orderStatus: { $nin: ["cancelled", "refunded"] },
        paymentStatus: { $nin: ["failed", "refunded"] }
      };

      const orders = await Order.find(SALE_FILTER);
      
      const data = [];
      for (const order of orders) {
        for (const item of order.items) {
          data.push({
            "Order ID": order._id.toString(),
            "Date": order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
            "Customer Name": order.customerName,
            "Customer Email": order.customerEmail || 'N/A',
            "Product": item.title,
            "SKU": item.skuId,
            "Quantity": item.quantity,
            "Price": item.price,
            "Subtotal": order.subtotal,
            "Total": order.total,
            "Payment Method": order.paymentMethod,
            "Payment Status": order.paymentStatus,
            "Order Status": order.orderStatus,
            "Shipping Address": order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}` : "N/A"
          });
        }
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
      
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=sales_report.xlsx");
      res.send(buffer);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.get(
  "/:id",
  conditionalAuthenticate,
  validateRequest({ params: OrderSchemas.params }),
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).populate(
        "items.productId"
      );
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  }
);

// Public tracking route
router.get(
  "/track/:id",
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).select(
        "orderStatus paymentStatus items.title items.quantity items.imageUrl customerName createdAt trackingNumber estimatedDelivery"
      );
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.post(
  "/",
  conditionalAuthenticate,
  validateRequest({ body: OrderSchemas.create }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const maxCoins = Math.floor(req.body.total / 50); // 2000 → 200
      const randomCoins = Math.floor(Math.random() * maxCoins) + 1;
      const loyalCoinGiven = Math.max(Math.min(randomCoins, 50), maxCoins);
      console.log(loyalCoinGiven);
      const orderPayload = { ...req.body, loyalCoinGiven };
      const order = new Order(orderPayload);

      // If authenticated, set user by id
      if (req.auth?.userId) {
        order.user = req.auth.userId as any;
      }
      await order.save();

      // Mark abandoned cart as recovered if it exists
      try {
        const query: any[] = [];
        if (req.body.customerId) query.push({ customerId: req.body.customerId });
        if (req.body.customerEmail) query.push({ customerEmail: req.body.customerEmail });
        if (req.body.customerPhone) query.push({ customerPhone: req.body.customerPhone });

        if (query.length > 0) {
          await AbandonedCart.findOneAndUpdate(
            { $or: query, recovered: false },
            { recovered: true, recoveryDate: new Date() }
          );
        }
      } catch (err) {
        console.error("Error marking abandoned cart as recovered:", err);
      }

      // If a user is provided, attach order to user's orders list and increment pendingLoyalCoin
      if (order.user) {
        await User.findByIdAndUpdate(order.user, {
          $addToSet: { orders: order._id },
          $inc: { pendingLoyalCoin: loyalCoinGiven },
        });
      }

      res.status(201).json(order);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.put(
  "/:id",
  conditionalAuthenticate,
  validateRequest({
    params: OrderSchemas.params,
    body: OrderSchemas.update,
  }),
  async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.delete(
  "/:id",
  conditionalAuthenticate,
  validateRequest({ params: OrderSchemas.params }),
  async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json({ message: "Order soft deleted" });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  }
);


export default router;
