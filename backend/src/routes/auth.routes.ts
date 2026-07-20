import { Router } from "express";
import { getMe, login, logout, register } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);

export default router;
