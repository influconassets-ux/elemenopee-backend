import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import HomeCategory from "./models/HomeCategory.js";
import HomeHeroCategory from "./models/HomeHeroCategory.js";
import HomeLatestStyle from "./models/HomeLatestStyle.js";
import HomeNewDrop from "./models/HomeNewDrop.js";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("Notice: Could not set custom DNS servers");
}

dotenv.config();

const MongoDB_Url = process.env.MONGO_URL || "mongodb://localhost:27017/elemenopee";

async function clearRedirects() {
  try {
    await mongoose.connect(MongoDB_Url);
    console.log("Connected to MongoDB...");

    const models = [HomeCategory, HomeHeroCategory, HomeLatestStyle, HomeNewDrop];
    
    for (const model of models) {
      const modelName = model.modelName;
      console.log(`Clearing redirectUrls for ${modelName}...`);
      const result = await model.updateMany({}, { $set: { redirectUrl: "" } });
      console.log(`Updated ${result.modifiedCount} documents in ${modelName}.`);
    }

    console.log("All redirectUrls cleared successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing redirects:", err);
    process.exit(1);
  }
}

clearRedirects();
