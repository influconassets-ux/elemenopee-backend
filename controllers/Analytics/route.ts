import express from "express";
import Visitor from "../../models/Visitor.js";
import { analyticsLimiter } from "../../middleware/rateLimiter.js";

const router: express.Router = express.Router();

router.post("/track", analyticsLimiter, async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { path, sessionId, visitorId } = req.body;

    const visit = new Visitor({
      ip: Array.isArray(ip) ? ip[0] : ip,
      userAgent,
      path,
      sessionId,
      visitorId: visitorId || sessionId // Use visitorId or fallback to sessionId
    });

    await visit.save();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ error: "Failed to track visit" });
  }
});

export default router;
