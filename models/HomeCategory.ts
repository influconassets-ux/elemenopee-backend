import mongoose, { Schema, Document } from "mongoose";

export interface IHomeCategory extends Document {
  title: string;
  imageUrl: string;
  redirectUrl: string;
  order: number;
}

const HomeCategorySchema: Schema = new Schema(
  {
    title: { type: String, required: false },
    imageUrl: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IHomeCategory>("HomeCategory", HomeCategorySchema);
