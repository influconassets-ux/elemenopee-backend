import express from "express";
import Shipment from "../../models/Shipment.js";
import Order from "../../models/Order.js";
import { getShippingProvider } from "../../utils/shiprocket/provider.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const shipments = await Shipment.find().populate("orderId").sort({ createdAt: -1 });
    res.json(shipments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate("orderId");
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });
    res.json(shipment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/dimensions", async (req, res) => {
  try {
    const { packageWeight, packageLength, packageBreadth, packageHeight } = req.body;
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, {
      packageWeight, packageLength, packageBreadth, packageHeight
    }, { new: true });
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });
    res.json({ message: "Dimensions updated", shipment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/create-order", async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate("orderId");
    if (!shipment) return res.status(404).json({ error: "Shipment not found" });

    if (!shipment.packageWeight || !shipment.packageLength || !shipment.packageBreadth || !shipment.packageHeight) {
      return res.status(400).json({ error: "Package dimensions and weight are required before creating an order" });
    }

    const order: any = shipment.orderId;
    if (!order) return res.status(400).json({ error: "Order details missing" });

    const addr = order.shippingAddress;
    if (!addr || !addr.street || !addr.city || !addr.state || !addr.zipCode) {
      return res.status(400).json({ 
        error: "Order is missing shipping address fields. Please check the order in your database.",
        debug: { shippingAddress: addr, customerName: order.customerName, customerPhone: order.customerPhone }
      });
    }

    const provider = getShippingProvider();

    const orderItems = order.items.map((item: any) => ({
      name: item.title,
      sku: item.skuId,
      units: item.quantity,
      selling_price: item.price,
      discount: "",
      tax: "",
      hsn: item.hsnCode || ""
    }));

    const nameParts = (order.customerName || "Customer").trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ".";

    const orderData = {
      order_id: shipment.merchantOrderId,
      order_date: new Date(order.createdAt || Date.now()).toISOString().split('T')[0],
      pickup_location: shipment.pickupLocation || process.env.SHIPROCKET_DEFAULT_PICKUP_LOCATION || "Primary",
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: addr.street,
      billing_address_2: addr.landmark || "",
      billing_city: addr.city,
      billing_pincode: String(addr.zipCode),
      billing_state: addr.state,
      billing_country: addr.country || "India",
      billing_email: order.customerEmail || "noreply@elemenopee.com",
      billing_phone: String(order.customerPhone || "9999999999").replace(/[^0-9]/g, ''),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: shipment.paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: order.total,
      length: shipment.packageLength,
      breadth: shipment.packageBreadth,
      height: shipment.packageHeight,
      weight: shipment.packageWeight
    };

    console.log("📦 Shiprocket Payload:", JSON.stringify(orderData, null, 2));

    const response = await provider.createOrder(orderData);
    
    shipment.shiprocketOrderId = response.order_id;
    shipment.shiprocketShipmentId = response.shipment_id;
    shipment.status = "NEW";
    shipment.internalStatus = "PROCESSING";
    await shipment.save();

    res.json({ message: "Order created in Shiprocket", shipment });
  } catch (error: any) {
    console.error("Shiprocket Create Order Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || JSON.stringify(error.response?.data?.errors) || error.message });
  }
});

router.post("/:id/generate-awb", async (req, res) => {
  try {
    const { courierId } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment || !shipment.shiprocketShipmentId) {
      return res.status(400).json({ error: "Invalid shipment state" });
    }

    const provider = getShippingProvider();
    const response = await provider.generateAwb(shipment.shiprocketShipmentId, courierId || "1");

    shipment.awbNumber = response.response.data.awb_code;
    shipment.courierName = response.response.data.courier_name;
    shipment.courierCompanyId = response.response.data.courier_company_id;
    await shipment.save();

    res.json({ message: "AWB Generated", shipment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/generate-label", async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment || !shipment.shiprocketShipmentId) return res.status(400).json({ error: "Invalid shipment state" });
    
    const provider = getShippingProvider();
    const response = await provider.generateLabel(shipment.shiprocketShipmentId);
    
    shipment.labelUrl = response.label_download_url || response.label_url;
    await shipment.save();
    res.json({ message: "Label generated", shipment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/schedule-pickup", async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment || !shipment.shiprocketShipmentId) return res.status(400).json({ error: "Invalid shipment state" });
    
    const provider = getShippingProvider();
    const response = await provider.requestPickup(shipment.shiprocketShipmentId);
    
    shipment.internalStatus = "READY_TO_SHIP";
    await shipment.save();
    res.json({ message: "Pickup scheduled", shipment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/check-serviceability", async (req, res) => {
  try {
    const { pickupPostcode, deliveryPostcode, weight, cod } = req.body;
    const provider = getShippingProvider();
    const response = await provider.checkServiceability(pickupPostcode, deliveryPostcode, weight, cod);
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
