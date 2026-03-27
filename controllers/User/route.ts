import express from "express";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import Order from "../../models/Order.js";
import { validateRequest } from "../../utils/validation.js";
import { UserSchemas } from "./schema.js";
import { authenticate, AuthenticatedRequest, generateToken } from "./auth.js";

const router: express.Router = express.Router();

router.post(
  "/register",
  validateRequest({ body: UserSchemas.register }),
  async (req, res) => {
    try {
      const { name, password, role } = req.body;
      const email = req.body.email.toLowerCase().trim();
      let user = await User.findOne({ email }).select("+password");

      if (user && user.password) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      if (user) {
        // Update existing user who doesn't have a password
        user.password = hashedPassword;
        if (name) user.name = name;
        if (role) user.role = role;
        await user.save();
      } else {
        // Create new user
        user = new User({
          name,
          email,
          password: hashedPassword,
          role: role || "user"
        });
        await user.save();
      }

      const token = generateToken({ userId: user._id.toString(), role: user.role });
      res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.post(
  "/login",
  validateRequest({ body: UserSchemas.login }),
  async (req, res) => {
    try {
      const password = req.body.password;
      const email = req.body.email.toLowerCase().trim();
      const user = await User.findOne({ email }).select("+password");
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken({ userId: user._id.toString(), role: user.role });
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.post(
  "/sync",
  validateRequest({ body: UserSchemas.sync }),
  async (req, res) => {
    try {
      const { firebaseUid, name, phone, gender } = req.body;
      const email = req.body.email ? req.body.email.toLowerCase().trim() : undefined;
      if (!firebaseUid) {
        return res.status(400).json({ error: "firebaseUid is required" });
      }

      let user = await User.findOne({ firebaseUid });
      if (!user) {
        user = new User({ firebaseUid, name, email, phone, gender });
        await user.save();
      } else {
        const changed =
          (name && user.name !== name) ||
          (email && user.email !== email) ||
          (phone && user.phone !== phone) ||
          (gender && user.gender !== gender);
        if (changed) {
          if (name) user.name = name;
          if (email) user.email = email;
          if (phone) user.phone = phone;
          if (gender) (user as any).gender = gender;
          await user.save();
        }
      }
      const token = generateToken({ userId: user._id.toString(), role: user.role });
      const payload = {
        token,
        loyalCoin: user.loyalCoin,
        pendingLoyalCoin: user.pendingLoyalCoin,
      };
      res.json(payload);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.put(
  "/",
  authenticate,
  validateRequest({ body: UserSchemas.update }),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await User.findById(req.auth.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatableFields: Array<keyof typeof req.body> = [
        "name",
        "email",
        "phone",
        "gender",
      ] as any;
      for (const field of updatableFields) {
        if (field in req.body && (req.body as any)[field] !== undefined) {
          (user as any)[field] = (req.body as any)[field];
        }
      }

      await user.save();
      res.json(user);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.get("/orders", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.auth?.userId) {
      const orders = await Order.find({ user: req.auth.userId })
        .sort({ createdAt: -1 })
        .populate("items.productId");
      res.json(orders);
    } else {
      res.json("User Not Found");
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
});

router.get(
  "/loyalcoins",
  authenticate,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await User.findById(req.auth.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        loyalCoin: user.loyalCoin ?? 0,
        pendingLoyalCoin: user.pendingLoyalCoin ?? 0,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
