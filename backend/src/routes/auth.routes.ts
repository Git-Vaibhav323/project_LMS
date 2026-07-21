import { Router } from "express";
import { getMe, logout, syncFaculty } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All routes require a valid Supabase JWT
router.post("/sync", requireAuth, syncFaculty);   // called after signUp
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);

export default router;
