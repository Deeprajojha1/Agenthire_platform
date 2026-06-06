import { Router } from "express";
import {
  applicationDetails,
  dashboard,
  jobs,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../../controllers/candidate/portalController.js";
import { requireAuth, requireCandidate } from "../../middleware/authMiddleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth, requireCandidate);
router.get("/dashboard", asyncHandler(dashboard));
router.get("/jobs", asyncHandler(jobs));
router.get("/applications/:id", asyncHandler(applicationDetails));
router.get("/notifications", asyncHandler(listNotifications));
router.patch("/notifications/read-all", asyncHandler(markAllNotificationsRead));
router.patch("/notifications/:id/read", asyncHandler(markNotificationRead));

export default router;
