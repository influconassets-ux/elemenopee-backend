import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product"; // import model
import { productList } from "./productList"; // import your array

dotenv.config();

const MongoDB_Url =
  process.env.MONGO_URL || "mongodb://localhost:27017/elemenopee";

// connect DB
mongoose
  .connect(MongoDB_Url)
  .then(async () => {
    console.log("MongoDB Connected ✅");

    // clear old data
    await Product.deleteMany();

    // insert new data
    await Product.insertMany(productList);

    console.log("Products seeded successfully 🌱");
    process.exit(); // exit after finish
  })
  .catch((err) => {
    console.error("DB connection error ❌", err);
    process.exit(1);
  });
