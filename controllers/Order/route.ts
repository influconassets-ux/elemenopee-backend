import express from "express";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import AbandonedCart from "../../models/AbandonedCart.js";
import Product from "../../models/Product.js";
import { Coupon } from "../../models/Coupon.js";
import { validateRequest } from "../../utils/validation.js";
import { OrderSchemas } from "./schema.js";
import { authenticate, type AuthenticatedRequest } from "../User/auth.js";
import XLSX from "xlsx";
import { sendFeedbackEmail } from "../../utils/email.js";
import Visitor from "../../models/Visitor.js";

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
      const { startDate, endDate } = req.query;
      
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Base filter for sales
      const BASE_SALE_FILTER: any = {
        isDeleted: { $ne: true },
        $or: [
          { paymentStatus: "paid" },
          { paymentMethod: "COD" } // Include all COD orders as potential revenue
        ],
        orderStatus: { $nin: ["cancelled", "refunded"] },
        paymentStatus: { $nin: ["failed", "refunded"] }
      };

      // Range filter for specific metrics
      const RANGE_FILTER: any = { ...BASE_SALE_FILTER };
      if (startDate || endDate) {
        RANGE_FILTER.createdAt = {};
        if (startDate) RANGE_FILTER.createdAt.$gte = new Date(startDate as string);
        if (endDate) RANGE_FILTER.createdAt.$lte = new Date(endDate as string);
      }

      const visitorRangeFilter: any = {};
      if (startDate || endDate) {
        visitorRangeFilter.timestamp = {};
        if (startDate) visitorRangeFilter.timestamp.$gte = new Date(startDate as string);
        if (endDate) visitorRangeFilter.timestamp.$lte = new Date(endDate as string);
      }

      const [daily, weekly, monthly, yearly, allOrders, rangeRevenueData, rangeOrdersCount, totalAddCards, visitorCount, statusCounts] = await Promise.all([
        Order.aggregate([
          { $match: { ...BASE_SALE_FILTER, createdAt: { $gte: startOfDay } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { ...BASE_SALE_FILTER, createdAt: { $gte: startOfWeek } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { ...BASE_SALE_FILTER, createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
          { $match: { ...BASE_SALE_FILTER, createdAt: { $gte: startOfYear } } },
          { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
        ]),
        Order.find({ ...RANGE_FILTER }).sort({ createdAt: -1 }).limit(10),
        Order.aggregate([
          { $match: RANGE_FILTER },
          { $group: { _id: null, total: { $sum: "$total" } } }
        ]),
        Order.countDocuments(RANGE_FILTER),
        AbandonedCart.countDocuments(startDate ? { createdAt: { $gte: new Date(startDate as string) } } : {}),
        Visitor.distinct("visitorId", visitorRangeFilter).then(ips => ips.length),
        Order.aggregate([
          { 
            $match: { 
              isDeleted: { $ne: true },
              createdAt: RANGE_FILTER.createdAt || { $exists: true }
            } 
          },
          {
            $group: {
              _id: "$orderStatus",
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      // Map status counts to a more usable object
      const counts: any = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0
      };
      statusCounts.forEach((item: any) => {
        if (counts.hasOwnProperty(item._id)) {
          counts[item._id] = item.count;
        }
      });

      // Last 30 days breakdown (independent of range filter usually, or should it be?)
      // Let's keep it 30 days or align with range
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dailyBreakdown = await Order.aggregate([
        { $match: { ...BASE_SALE_FILTER, createdAt: { $gte: thirtyDaysAgo } } },
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
        dailyBreakdown,
        totalRevenue: rangeRevenueData[0]?.total || 0,
        totalOrders: rangeOrdersCount,
        totalAddCards: totalAddCards,
        visitors: visitorCount,
        statusCounts: counts
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
      const { startDate, endDate } = req.query;

      const SALE_FILTER: any = {
        isDeleted: { $ne: true },
        $or: [
          { paymentStatus: "paid" },
          { paymentMethod: "COD" }
        ],
        orderStatus: { $nin: ["cancelled", "refunded"] },
        paymentStatus: { $nin: ["failed", "refunded"] }
      };

      if (startDate || endDate) {
        SALE_FILTER.createdAt = {};
        if (startDate) SALE_FILTER.createdAt.$gte = new Date(startDate as string);
        if (endDate) SALE_FILTER.createdAt.$lte = new Date(endDate as string);
      }

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
        "orderStatus paymentStatus paymentMethod items.title items.quantity items.imageUrl customerName createdAt trackingNumber estimatedDelivery"
      );

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // If online payment, only allow tracking if it's paid
      if (order.paymentMethod === "Razorpay" && order.paymentStatus !== "paid") {
        return res.status(404).json({ error: "Order tracking not available for incomplete payments" });
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

      // Reduce inventory for each item
      try {
        if (req.body.items && Array.isArray(req.body.items)) {
          for (const item of req.body.items) {
            const quantity = parseInt(item.quantity) || 1;
            if (item.productId) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { inventory: -quantity }
              });
            } else if (item.skuId) {
              await Product.findOneAndUpdate({ skuId: item.skuId }, {
                $inc: { inventory: -quantity }
              });
            }
          }
        }
      } catch (err) {
        console.error("Error reducing inventory:", err);
        // We don't want to fail the order if inventory update fails, 
        // but it's worth logging.
      }

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

      // Increment coupon usage if applied
      if (req.body.appliedCouponCode) {
        try {
          const coupon = await Coupon.findOne({ code: req.body.appliedCouponCode.toUpperCase() });
          if (coupon) {
            coupon.usageCount = (coupon.usageCount || 0) + 1;
            if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
              coupon.isActive = false;
            }
            await coupon.save();
          }
        } catch (err) {
          console.error("Error updating coupon usage:", err);
        }
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
      // Find the order before update to check previous status
      const oldOrder = await Order.findById(req.params.id);
      if (!oldOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if status was changed to delivered
      if (req.body.orderStatus === "delivered" && oldOrder.orderStatus !== "delivered") {
        console.log(`[Order Update] Order ${order._id} marked as delivered. Attempting to send feedback email.`);

        if (order.customerEmail) {
          // Send email asynchronously
          sendFeedbackEmail(
            order.customerEmail,
            order._id.toString(),
            order.customerName
          ).catch(err => console.error("Async email error:", err));
        } else {
          console.warn(`[Order Update] Could not send feedback email for order ${order._id} because customerEmail is missing.`);
        }
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
