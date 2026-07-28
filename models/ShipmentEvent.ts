import mongoose from "mongoose";

const shipmentEventSchema = new mongoose.Schema(
  {
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true },
    source: { type: String, enum: ["Webhook", "API Sync", "Manual"], required: true },
    eventKey: { type: String }, // e.g. "STATUS_UPDATE", "AWB_GENERATED"
    providerStatus: { type: String }, // the original status string/code from Shiprocket
    internalStatus: { type: String }, // our mapped internal status
    eventTimestamp: { type: Date },
    processedTimestamp: { type: Date, default: Date.now },
    sanitizedPayload: { type: mongoose.Schema.Types.Mixed }, // flexible JSON for webhook payload
  },
  { timestamps: true }
);

const ShipmentEvent = mongoose.model("ShipmentEvent", shipmentEventSchema);
export default ShipmentEvent;
