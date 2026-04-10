import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  name: string;
  imageUrl: string;
  review: string;
  order: number;
}

const ReviewSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    imageUrl: { type: String },
    review: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>("Review", ReviewSchema);
