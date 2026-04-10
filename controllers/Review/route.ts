import express from "express";
import Review from "../../models/Review.js";

const router: express.Router = express.Router();

// GET all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ order: 1 });
    res.json(reviews);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// GET single review
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json(review);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

// CREATE a review
router.post("/", async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// UPDATE a review
router.put("/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json(review);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

// DELETE a review
router.delete("/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json({ message: "Review deleted" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;
