import express from "express";
import HomeNewDrop from "../../models/HomeNewDrop.js";

const router: express.Router = express.Router();

router.get("/", async (req, res) => {
  try {
    const newDrops = await HomeNewDrop.find().sort({ order: 1 });
    res.json(newDrops);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const newDrop = await HomeNewDrop.findById(req.params.id);
    if (!newDrop) {
      return res.status(404).json({ error: "New drop not found" });
    }
    res.json(newDrop);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

router.post("/", async (req, res) => {
  try {
    const newDrop = new HomeNewDrop(req.body);
    await newDrop.save();
    res.status(201).json(newDrop);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const newDrop = await HomeNewDrop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!newDrop) {
      return res.status(404).json({ error: "New drop not found" });
    }
    res.json(newDrop);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const newDrop = await HomeNewDrop.findByIdAndDelete(req.params.id);
    if (!newDrop) {
      return res.status(404).json({ error: "New drop not found" });
    }
    res.json({ message: "New drop deleted" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
