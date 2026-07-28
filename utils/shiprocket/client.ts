import axios, { AxiosInstance } from "axios";
import { SHIPROCKET_CONFIG } from "./config.js";
import { getShiprocketToken } from "./tokenManager.js";

export const getShiprocketClient = async (): Promise<AxiosInstance> => {
  const token = await getShiprocketToken();

  return axios.create({
    baseURL: SHIPROCKET_CONFIG.API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    timeout: 10000,
  });
};
