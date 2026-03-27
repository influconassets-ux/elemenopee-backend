import jwt, { JwtPayload } from "jsonwebtoken";
import type express from "express";
import dotenv from "dotenv";
dotenv.config();

type BaseTokenPayload = JwtPayload & {
  userId: string;
  role: string;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in environment variables");
  }
  return secret;
}

export function generateToken(payload: { userId: string; role: string }, options?: { expiresInSeconds?: number }): string {
  const expiresIn = options?.expiresInSeconds ?? 60 * 60 * 24 * 7; // default 7 days
  return jwt.sign(payload, getJwtSecret(), { algorithm: "HS256", expiresIn });
}

export function verifyToken(token: string): BaseTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as BaseTokenPayload;
}

export function decodeUnverifiedToken(token: string): BaseTokenPayload | null {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === "string") return null;
  return decoded as BaseTokenPayload;
}

export type { BaseTokenPayload };

export interface AuthenticatedRequest extends express.Request {
  auth?: BaseTokenPayload;
}



export function authenticate(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  try {
    const header = req.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const token = header.substring("Bearer ".length).trim();
    const payload = verifyToken(token);
    req.auth = payload;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return res.status(401).json({ error: message });
  }
}

