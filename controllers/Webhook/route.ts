import express from "express";
import ShipmentEvent from "../../models/ShipmentEvent.js";
import Shipment from "../../models/Shipment.js";
import { SHIPROCKET_CONFIG } from "../../utils/shiprocket/config.js";
import { mapShiprocketStatusToInternal } from "../../utils/shiprocket/statusMapping.js";

const router = express.Router();

router.post("/shipping-status", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (SHIPROCKET_CONFIG.WEBHOOK_SECRET && apiKey !== SHIPROCKET_CONFIG.WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const payload = req.body;
    
    // According to Shiprocket, they send awb in `awb` or `awb_code`
    const awb = payload.awb || payload.awb_code;
    const currentStatusId = payload.current_status_id;
    
    if (!awb || currentStatusId === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the shipment
    const shipment = await Shipment.findOne({ awbNumber: awb });
    if (!shipment) {
      console.warn(`Webhook received for unknown AWB: ${awb}`);
      return res.status(200).send("OK");
    }

    const internalStatus = mapShiprocketStatusToInternal(currentStatusId);

    // Save event
    const event = new ShipmentEvent({
      shipmentId: shipment._id,
      source: "Webhook",
      eventKey: "STATUS_UPDATE",
      providerStatus: currentStatusId.toString(),
      internalStatus,
      eventTimestamp: new Date(),
      sanitizedPayload: payload,
    });
    await event.save();

    // Update Shipment
    shipment.status = payload.current_status || "UNKNOWN";
    shipment.internalStatus = internalStatus;
    await shipment.save();

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
