import { Router } from "express";
import { checkApplication, getCandidate, listCandidates, updateCandidate, uploadCandidate } from "../controllers/candidateController.js";
import { optionalAuth, requireAuth, requireRecruiter } from "../middleware/authMiddleware.js";
import { resumeUpload } from "../middleware/uploadMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { checkApplicationSchema, updateCandidateSchema, uploadCandidateSchema } from "../validators/candidateValidators.js";

const router = Router();
router.post("/check-application", validateBody(checkApplicationSchema), asyncHandler(checkApplication));
router.post("/upload", optionalAuth, resumeUpload.single("resume"), validateBody(uploadCandidateSchema), asyncHandler(uploadCandidate));
router.get("/", requireAuth, requireRecruiter, asyncHandler(listCandidates));
router.get("/:id", requireAuth, requireRecruiter, asyncHandler(getCandidate));
router.patch("/:id", requireAuth, requireRecruiter, validateBody(updateCandidateSchema), asyncHandler(updateCandidate));
export default router;
