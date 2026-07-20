import { Router } from "express";
import {
  createContent,
  deleteContent,
  getContentById,
  getDashboardSummary,
  listContent,
  updateContent,
} from "../controllers/content.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  contentQuerySchema,
  createContentSchema,
  updateContentSchema,
} from "../validators/content.validator";

const router = Router();

// All content routes require an authenticated faculty member.
router.use(requireAuth);

router.get("/dashboard/summary", getDashboardSummary);

router
  .route("/")
  .get(validate(contentQuerySchema, "query"), listContent)
  .post(upload.single("file"), validate(createContentSchema), createContent);

router
  .route("/:id")
  .get(getContentById)
  .put(upload.single("file"), validate(updateContentSchema), updateContent)
  .delete(deleteContent);

export default router;
