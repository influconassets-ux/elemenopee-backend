import express from "express";
import mongoose from "mongoose";
import { authenticate } from "../User/auth.js";

const router = express.Router();

// Helper to get all rate limit collections
const COLLECTIONS = [
  'rate_limits_global',
  'rate_limits_auth',
  'rate_limits_contact',
  'rate_limits_analytics'
];

/**
 * @route GET /api/security/blocks
 * @desc Get all currently blocked/tracked IPs across all limiters
 * @access Admin
 */
router.get("/blocks", authenticate, async (req: any, res) => {
  try {
    if (req.auth?.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const allBlocks: any[] = [];
    const db = mongoose.connection.db;

    if (!db) {
        return res.status(500).json({ error: "Database connection not ready" });
    }

    for (const collName of COLLECTIONS) {
      const collection = db.collection(collName);
      const limits = await collection.find({}).toArray();
      
      limits.forEach(limit => {
        allBlocks.push({
          id: `${collName}_${limit._id}`,
          ip: limit._id, // rate-limit-mongo uses IP as _id
          hits: limit.hits,
          expiresAt: limit.expireAt || limit.expiresAt || limit.resetTime,
          type: collName.replace('rate_limits_', '')
        });
      });
    }

    res.json(allBlocks);
  } catch (err) {
    console.error("Error fetching blocks:", err);
    res.status(500).json({ error: "Failed to fetch security blocks" });
  }
});

/**
 * @route DELETE /api/security/blocks/:ip
 * @desc Unblock an IP across all limiters
 * @access Admin
 */
router.delete("/blocks/:ip", authenticate, async (req: any, res) => {
  try {
    if (req.auth?.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { ip } = req.params;
    const db = mongoose.connection.db;
    
    if (!db) {
        return res.status(500).json({ error: "Database connection not ready" });
    }

    let deletedCount = 0;
    for (const collName of COLLECTIONS) {
      const collection = db.collection(collName);
      const result = await collection.deleteOne({ _id: ip });
      if (result.deletedCount) deletedCount++;
    }

    res.json({ message: `Successfully unblocked IP: ${ip}`, deletedCount });
  } catch (err) {
    console.error("Error unblocking IP:", err);
    res.status(500).json({ error: "Failed to unblock IP" });
  }
});

export default router;
