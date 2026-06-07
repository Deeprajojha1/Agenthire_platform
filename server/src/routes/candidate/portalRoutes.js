import { Router } from "express";
import {
  applicationDetails,
  dashboard,
  jobs,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../../controllers/candidate/portalController.js";
import {
  completeInterview,
  getInterview,
  questionAudio,
  startInterview,
  submitAnswer
} from "../../controllers/candidate/interviewController.js";
import { requireAuth, requireCandidate } from "../../middleware/authMiddleware.js";
import { interviewUpload } from "../../middleware/interviewUploadMiddleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireCandidate);
router.get("/dashboard", asyncHandler(dashboard));
router.get("/jobs", asyncHandler(jobs));
router.get("/applications/:id", asyncHandler(applicationDetails));
router.get("/notifications", asyncHandler(listNotifications));
router.patch("/notifications/read-all", asyncHandler(markAllNotificationsRead));
router.patch("/notifications/:id/read", asyncHandler(markNotificationRead));
router.post("/interviews/:applicationId/start", asyncHandler(startInterview));
router.get("/interviews/session/:interviewId", asyncHandler(getInterview));
router.post("/interviews/session/:interviewId/questions/:questionId/audio", asyncHandler(questionAudio));
router.post("/interviews/session/:interviewId/answers", interviewUpload.single("recording"), asyncHandler(submitAnswer));
router.post("/interviews/session/:interviewId/complete", asyncHandler(completeInterview));

export default router;
