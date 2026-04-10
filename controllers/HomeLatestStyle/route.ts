import express from "express";
import HomeLatestStyle from "../../models/HomeLatestStyle.js";

const router: express.Router = express.Router();

// GET all home latest styles
router.get("/", async (req, res) => {
  try {
    const latestStyles = await HomeLatestStyle.find().sort({ order: 1 });
    res.json(latestStyles);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// GET single latest style
router.get("/:id", async (req, res) => {
  try {
    const style = await HomeLatestStyle.findById(req.params.id);
    if (!style) {
      return res.status(404).json({ error: "Latest style not found" });
    }
    res.json(style);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// CREATE a latest style
router.post("/", async (req, res) => {
  try {
    const style = new HomeLatestStyle(req.body);
    await style.save();
    res.status(201).json(style);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// UPDATE a latest style
router.put("/:id", async (req, res) => {
  try {
    const style = await HomeLatestStyle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!style) {
      return res.status(404).json({ error: "Latest style not found" });
    }
    res.json(style);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// DELETE a latest style
router.delete("/:id", async (req, res) => {
  try {
    const style = await HomeLatestStyle.findByIdAndDelete(req.params.id);
    if (!style) {
      return res.status(404).json({ error: "Latest style not found" });
    }
    res.json({ message: "Latest style deleted" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
