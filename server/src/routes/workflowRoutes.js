import { Router } from "express";
import { approveWorkflow, clearWorkflows, deleteWorkflow, getWorkflow, listWorkflows, recruiterReview, retryWorkflow, startWorkflow } from "../controllers/workflowController.js";
import { requireAuth, requireRecruiter } from "../middleware/authMiddleware.js";
import { interviewDocumentUpload } from "../middleware/uploadMiddleware.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { approveWorkflowSchema, recruiterReviewSchema, retryWorkflowSchema, startWorkflowSchema } from "../validators/workflowValidators.js";

const router = Router();
router.use(requireAuth, requireRecruiter);
router.get("/", asyncHandler(listWorkflows));
router.delete("/", asyncHandler(clearWorkflows));
router.post("/start", validateBody(startWorkflowSchema), asyncHandler(startWorkflow));
router.post("/retry", validateBody(retryWorkflowSchema), asyncHandler(retryWorkflow));
router.post("/approve", interviewDocumentUpload.array("interview_documents", 5), validateBody(approveWorkflowSchema), asyncHandler(approveWorkflow));
router.post("/recruiter-review", validateBody(recruiterReviewSchema), asyncHandler(recruiterReview));
router.get("/:id", asyncHandler(getWorkflow));
router.delete("/:id", asyncHandler(deleteWorkflow));
export default router;
