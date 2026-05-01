import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  path: String,
  visitorId: String,
  sessionId: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for faster querying and potential uniqueness checks
visitorSchema.index({ timestamp: 1 });
visitorSchema.index({ visitorId: 1, timestamp: 1 });
visitorSchema.index({ ip: 1, timestamp: 1 });

const Visitor = mongoose.model("Visitor", visitorSchema);
export default Visitor;
