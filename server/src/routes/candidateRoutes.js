import { Router } from "express";
import { checkApplication, getCandidate, listCandidates, uploadCandidate } from "../controllers/candidateController.js";
import { requireAuth, requireRecruiter } from "../middleware/authMiddleware.js";
import { resumeUpload } from "../middleware/uploadMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { checkApplicationSchema, uploadCandidateSchema } from "../validators/candidateValidators.js";

const router = Router();
router.post("/check-application", validateBody(checkApplicationSchema), asyncHandler(checkApplication));
router.post("/upload", resumeUpload.single("resume"), validateBody(uploadCandidateSchema), asyncHandler(uploadCandidate));
router.get("/", requireAuth, requireRecruiter, asyncHandler(listCandidates));
router.get("/:id", requireAuth, requireRecruiter, asyncHandler(getCandidate));
export default router;
