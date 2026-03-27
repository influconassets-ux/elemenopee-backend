import express from "express";
import AbandonedCart from "../../models/AbandonedCart.js";
import { validateRequest } from "../../utils/validation.js";
import { AbandonedCartSchemas } from "./schema.js";

const router: express.Router = express.Router();

router.get("/",
  validateRequest({ query: AbandonedCartSchemas.query }),
  async (req, res) => {
    try {
      const abandonedCarts = await AbandonedCart.find().populate('items.productId');
      res.json(abandonedCarts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.get("/:id",
  validateRequest({ params: AbandonedCartSchemas.params }),
  async (req, res) => {
    try {
      const abandonedCart = await AbandonedCart.findById(req.params.id).populate('items.productId');
      if (!abandonedCart) {
        return res.status(404).json({ error: "Abandoned cart not found" });
      }
      res.json(abandonedCart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.post("/",
  validateRequest({ body: AbandonedCartSchemas.create }),
  async (req, res) => {
    try {
      const { customerId, customerEmail, customerPhone } = req.body;

      let existingCart = null;

      if (customerId) {
        existingCart = await AbandonedCart.findOne({ customerId });
      } else if (customerEmail) {
        existingCart = await AbandonedCart.findOne({ customerEmail });
      } else if (customerPhone) {
        existingCart = await AbandonedCart.findOne({ customerPhone });
      }

      if (existingCart) {
        Object.assign(existingCart, req.body);
        existingCart.lastActivity = new Date();
        await existingCart.save();
        return res.json(existingCart);
      }

      const abandonedCart = new AbandonedCart(req.body);
      await abandonedCart.save();
      res.status(201).json(abandonedCart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.put("/:id",
  validateRequest({
    params: AbandonedCartSchemas.params,
    body: AbandonedCartSchemas.update
  }),
  async (req, res) => {
    try {
      const abandonedCart = await AbandonedCart.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!abandonedCart) {
        return res.status(404).json({ error: "Abandoned cart not found" });
      }
      res.json(abandonedCart);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.delete("/:id",
  validateRequest({ params: AbandonedCartSchemas.params }),
  async (req, res) => {
    try {
      const abandonedCart = await AbandonedCart.findByIdAndDelete(req.params.id);
      if (!abandonedCart) {
        return res.status(404).json({ error: "Abandoned cart not found" });
      }
      res.json({ message: "Abandoned cart deleted" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

export default router;
