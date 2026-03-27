import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  name: { type: String },
  email: { type: String, index: true, unique: true, sparse: true },
  password: { type: String, select: false },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  phone: { type: String },
  gender: { type: String, enum: ["male", "female", "other"] },
  pendingLoyalCoin: { type: Number, default: 0 },
  loyalCoin: { type: Number, default: 0 },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;


