import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    merchantOrderId: { type: String, required: true, unique: true },
    shiprocketOrderId: { type: String },
    shiprocketShipmentId: { type: String },
    awbNumber: { type: String, unique: true, sparse: true },
    courierCompanyId: { type: String },
    courierName: { type: String },
    pickupLocation: { type: String },
    paymentMethod: { type: String, enum: ["Prepaid", "COD"], required: true },
    codAmount: { type: Number, default: 0 },
    packageWeight: { type: Number },
    packageLength: { type: Number },
    packageBreadth: { type: Number },
    packageHeight: { type: Number },
    estimatedFreightCharge: { type: Number },
    estimatedCodCharge: { type: Number },
    actualFreightCharge: { type: Number },
    status: { type: String }, // Shiprocket exact status text
    internalStatus: { 
      type: String, 
      enum: ["PENDING", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO_INITIATED", "RTO_DELIVERED", "CANCELLED", "ERROR"],
      default: "PENDING"
    },
    labelUrl: { type: String },
    invoiceUrl: { type: String },
    manifestUrl: { type: String },
    trackingUrl: { type: String },
    testMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Shipment = mongoose.model("Shipment", shipmentSchema);
export default Shipment;
