import rateLimit from 'express-rate-limit';
import MongoStore from 'rate-limit-mongo';
import dotenv from 'dotenv';

dotenv.config();

// Match the exact environment variables used in server.ts
const MongoDB_Url = process.env.MONGO_URL || "mongodb://localhost:27017/elemenopee";

const commonMessage = {
  status: 429,
  message: "Too many requests, kindly contact with admin or wait 10 minutes"
};

// Persistent store using MongoDB
const createStore = (collectionName: string, expiryMs: number) => {
  if (!MongoDB_Url) {
    console.warn(`No MongoDB URL found for ${collectionName} rate limiter store, falling back to memory.`);
    return undefined;
  }
  return new MongoStore({
    uri: MongoDB_Url,
    collectionName: collectionName,
    expireTimeMs: expiryMs,
    errorHandler: (err) => console.error('Rate limit store error:', err)
  });
};

// Skip OPTIONS requests (CORS pre-flight)
const skipOptions = (req: any) => req.method === 'OPTIONS';

// Global rate limiter
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Safe for dashboard/user site loading
  store: createStore('rate_limits_global', 15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipOptions,
  message: commonMessage
});

// Auth limiter - Set to 15 attempts per hour as per request (between 10-30)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15, 
  store: createStore('rate_limits_auth', 60 * 60 * 1000),
  skip: skipOptions,
  message: commonMessage
});

// Contact limiter
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: createStore('rate_limits_contact', 60 * 60 * 1000),
  skip: skipOptions,
  message: commonMessage
});

// Analytics limiter
export const analyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  store: createStore('rate_limits_analytics', 1 * 60 * 1000),
  skip: skipOptions,
  message: commonMessage
});
