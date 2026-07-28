import dotenv from "dotenv";
dotenv.config();

export const SHIPROCKET_CONFIG = {
  MODE: process.env.SHIPROCKET_MODE || "mock", // "live" or "mock"
  API_EMAIL: process.env.SHIPROCKET_API_EMAIL || "",
  API_PASSWORD: process.env.SHIPROCKET_API_PASSWORD || "",
  WEBHOOK_SECRET: process.env.SHIPROCKET_WEBHOOK_SECRET || "",
  DEFAULT_PICKUP_LOCATION: process.env.SHIPROCKET_DEFAULT_PICKUP_LOCATION || "Primary",
  API_BASE_URL: "https://apiv2.shiprocket.in/v1/external",
};

// Strict Validation for Live Mode
if (SHIPROCKET_CONFIG.MODE === "live") {
    if (!SHIPROCKET_CONFIG.API_EMAIL || !SHIPROCKET_CONFIG.API_PASSWORD) {
        console.error("❌ CRITICAL ERROR: SHIPROCKET_MODE is set to 'live' but API_EMAIL or API_PASSWORD are missing in .env");
        process.exit(1); // Kill the server to prevent broken production states
    }
    console.log("✅ Shiprocket is running in LIVE mode.");
} else {
    console.warn("⚠️ Shiprocket is running in MOCK mode. No real API calls will be made.");
}
