import type { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import Order from "../models/Order.js";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const createRazorpayOrder = async (req: Request, res: Response) => {
  const { amount, currency = "INR", receipt } = req.body;

  try {
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Payment is verified
    try {
      const order = await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }, { new: true });

      if (order) {
        // Import Shipment model dynamically to avoid circular dependencies or just require it
        const Shipment = (await import("../models/Shipment.js")).default;
        
        // Ensure no duplicate shipment is created
        const existingShipment = await Shipment.findOne({ orderId: order._id });
        if (!existingShipment) {
          const shipment = new Shipment({
            orderId: order._id,
            merchantOrderId: order._id.toString(),
            paymentMethod: "Prepaid",
            codAmount: 0,
            internalStatus: "PENDING",
            testMode: process.env.SHIPROCKET_MODE === "mock"
          });
          await shipment.save();
        }
      }

      res.status(200).json({ status: "success", message: "Payment verified successfully" });
    } catch (error) {
      console.error("Order update error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  } else {
    res.status(400).json({ status: "failure", message: "Invalid signature" });
  }
};
