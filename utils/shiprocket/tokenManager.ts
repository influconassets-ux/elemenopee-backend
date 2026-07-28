import axios from "axios";
import { SHIPROCKET_CONFIG } from "./config.js";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export const getShiprocketToken = async (): Promise<string> => {
  if (SHIPROCKET_CONFIG.MODE === "mock") {
    return "mock_token_12345";
  }

  // Check if token exists and is valid (adding 1 min buffer)
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  try {
    const response = await axios.post(`${SHIPROCKET_CONFIG.API_BASE_URL}/auth/login`, {
      email: SHIPROCKET_CONFIG.API_EMAIL,
      password: SHIPROCKET_CONFIG.API_PASSWORD,
    });

    cachedToken = response.data.token;
    // Token is valid for 10 days (240 hours) according to docs.
    tokenExpiry = Date.now() + 10 * 24 * 60 * 60 * 1000;

    if (!cachedToken) {
        throw new Error("Shiprocket auth response missing token");
    }

    return cachedToken;
  } catch (error: any) {
    console.error("Failed to authenticate with Shiprocket:", error.response?.data || error.message);
    throw new Error("Shiprocket authentication failed");
  }
};
