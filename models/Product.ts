import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  size: [String],
  skuId: { type: String, unique: true },
  price: Number,
  discountedPrice: Number,
  discountPercent: Number,
  category: String,
  imageUrl: String,
  images: [String],
  variations: String,
  tags: [String]
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
