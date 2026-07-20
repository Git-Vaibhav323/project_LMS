import { Router } from "express";
import authRoutes from "./auth.routes";
import contentRoutes from "./content.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/content", contentRoutes);

export default router;
