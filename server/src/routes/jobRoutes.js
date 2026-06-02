import { Router } from "express";
import { createJob, getJob, listJobs, updateJob } from "../controllers/jobController.js";
import { requireAuth, requireRecruiter } from "../middleware/authMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createJobSchema, updateJobSchema } from "../validators/jobValidators.js";

const router = Router();
router.get("/", asyncHandler(listJobs));
router.get("/:id", asyncHandler(getJob));
router.post("/", requireAuth, requireRecruiter, validateBody(createJobSchema), asyncHandler(createJob));
router.put("/:id", requireAuth, requireRecruiter, validateBody(updateJobSchema), asyncHandler(updateJob));
export default router;
