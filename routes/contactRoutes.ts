import express from "express";
import contactController from "../controllers/Contact/route.js";

const router = express.Router();

router.use("/", contactController);

export default router;
