import mongoose from "mongoose";

const abandonedCartSchema = new mongoose.Schema({
  customerId: String,
  customerEmail: String,
  customerName: String,
  customerPhone: String,
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    skuId: String,
    quantity: { type: Number, min: 1 },
    price: Number,
    discountedPrice: Number,
    size: String,
    imageUrl: String
  }],
  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  abandonedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  recoveryAttempts: { type: Number, default: 0 },
  recovered: { type: Boolean, default: false },
  recoveryDate: Date,
  notes: String
}, { timestamps: true });

const AbandonedCart = mongoose.model("AbandonedCart", abandonedCartSchema);
export default AbandonedCart;
