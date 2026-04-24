import express from "express";
import HomeHeroCategory from "../../models/HomeHeroCategory.js";

const router: express.Router = express.Router();

router.get("/", async (req, res) => {
  try {
    const heroCats = await HomeHeroCategory.find().sort({ order: 1 });
    res.json(heroCats);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const heroCat = await HomeHeroCategory.findById(req.params.id);
    if (!heroCat) {
      return res.status(404).json({ error: "Hero category not found" });
    }
    res.json(heroCat);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

router.post("/", async (req, res) => {
  try {
    const heroCat = new HomeHeroCategory(req.body);
    await heroCat.save();
    res.status(201).json(heroCat);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const heroCat = await HomeHeroCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!heroCat) {
      return res.status(404).json({ error: "Hero category not found" });
    }
    res.json(heroCat);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const heroCat = await HomeHeroCategory.findByIdAndDelete(req.params.id);
    if (!heroCat) {
      return res.status(404).json({ error: "Hero category not found" });
    }
    res.json({ message: "Hero category deleted" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
