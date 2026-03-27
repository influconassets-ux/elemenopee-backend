import express from "express";
import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
// Schema fix: imageUrl now accepts empty strings
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import swaggerUi from "swagger-ui-express";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import abandonedCartRoutes from "./routes/abandonedCartRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import updateRoutes from "./routes/updateRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { specs } from "./swagger.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    "https://elemenopee.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://elemenopee-dashboard.vercel.app", // your Vercel frontend
    "http://localhost:3000" // optional for local dev
  ],
  credentials: true,
}));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

const MongoDB_Url = process.env.MONGO_URL || "mongodb://localhost:27017/elemenopee";

// Routes
app.use("/api/update", updateRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/abandoned-carts", abandonedCartRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);

// Health check endpoint for render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Elemenopee Backend API",
    status: "running",
    docs: "/api-docs",
    health: "/health",
    endpoints: {
      products: "/api/products",
      orders: "/api/orders",
      abandonedCarts: "/api/abandoned-carts",
      users: "/api/users"
    }
  });
});

// Start HTTP server FIRST so Render detects the open port
const PORT = parseInt(process.env.PORT || "5000", 10);
const HOST = "0.0.0.0"; // Required for some PaaS providers (Render, Docker, etc.)

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server listening on http://${HOST}:${PORT}`);
  console.log(`📚 Swagger docs: http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}/api-docs`);
  console.log(`❤️  Health check: http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}/health`);
});

// Handle server errors
server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Attempt MongoDB connection AFTER server starts (non-blocking)
mongoose
  .connect(MongoDB_Url)
  .then(() => {
    console.log("MongoDB Connected ✅");
  })
  .catch((err) => {
    console.log("MongoDB_Url", MongoDB_Url);
    console.error("❌ MongoDB connection error (server is still running):", err.message || err);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false).then(() => {
      console.log('Mongo connection closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
