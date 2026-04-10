import express from "express";
import HomeCategory from "../../models/HomeCategory.js";

const router: express.Router = express.Router();

// GET all home categories
router.get("/", async (req, res) => {
  try {
    const categories = await HomeCategory.find().sort({ order: 1 });
    res.json(categories);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// GET single home category
router.get("/:id", async (req, res) => {
  try {
    const category = await HomeCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Home category not found" });
    }
    res.json(category);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// CREATE a home category
router.post("/", async (req, res) => {
  try {
    const category = new HomeCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// UPDATE a home category
router.put("/:id", async (req, res) => {
  try {
    const category = await HomeCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ error: "Home category not found" });
    }
    res.json(category);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// DELETE a home category
router.delete("/:id", async (req, res) => {
  try {
    const category = await HomeCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Home category not found" });
    }
    res.json({ message: "Home category deleted" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
