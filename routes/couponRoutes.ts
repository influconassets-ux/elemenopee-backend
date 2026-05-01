import express from "express";
import { createCoupon, getActiveCoupons, getAllCoupons, validateCoupon, updateCoupon, deleteCoupon } from "../controllers/Coupon/route.js";

const router = express.Router();

router.post("/", createCoupon);
router.get("/", getActiveCoupons);
router.get("/admin", getAllCoupons);
router.post("/validate", validateCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;
