import { Router } from "express";
import { analytics } from "../controllers/analyticsController.js";
import { requireAuth, requireRecruiter } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.get("/", requireAuth, requireRecruiter, asyncHandler(analytics));
export default router;
