import express, { Request, Response } from "express";
import Contact from "../../models/Contact.js";
import { authenticate } from "../User/auth.js";
import { contactLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// Public: Submit contact form
router.post("/", contactLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newMessage = new Contact({ name, email, subject, message });
    await newMessage.save();

    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
});

// Admin: Get all messages
router.get("/admin", authenticate, async (req: Request, res: Response) => {
  try {
    const messages = await Contact.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
});

// Admin: Update status (mark as read/replied)
router.put("/admin/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: "Message not found" });
    res.json(message);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
});

// Admin: Delete message
router.delete("/admin/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!message) return res.status(404).json({ error: "Message not found" });
    res.json({ message: "Message deleted" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
