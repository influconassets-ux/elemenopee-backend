import Shipment from "../../models/Shipment.js";

// ReconcileShipmentJob - A simple job to find stalled shipments and verify status
export const initializeShippingJobs = () => {
  // Run every 6 hours (6 * 60 * 60 * 1000)
  setInterval(async () => {
    console.log("[Job] Running ReconcileShipmentJob");
    try {
      const stalledShipments = await Shipment.find({
        internalStatus: { $in: ["IN_TRANSIT", "PROCESSING"] },
        updatedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // older than 24h
      });

      console.log(`[Job] Found ${stalledShipments.length} stalled shipments.`);
      // Real scenario: fetch latest tracking from Shiprocket API and update
    } catch (error) {
      console.error("[Job] ReconcileShipmentJob failed:", error);
    }
  }, 6 * 60 * 60 * 1000);
};
