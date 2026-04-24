import mongoose, { Schema, Document } from "mongoose";

export interface IHomeNewDrop extends Document {
  title: string;
  imageUrl: string;
  redirectUrl: string;
  order: number;
}

const HomeNewDropSchema: Schema = new Schema(
  {
    title: { type: String, required: false },
    imageUrl: { type: String, required: true },
    redirectUrl: { type: String, required: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IHomeNewDrop>("HomeNewDrop", HomeNewDropSchema);
