import { Router } from "express";
import { login, me, signup } from "../../controllers/candidate/authController.js";
import { requireAuth, requireCandidate } from "../../middleware/authMiddleware.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { loginSchema, signupSchema } from "../../validators/candidate/authValidators.js";

const router = Router();

router.post("/signup", validateBody(signupSchema), asyncHandler(signup));
router.post("/login", validateBody(loginSchema), asyncHandler(login));
router.get("/me", requireAuth, requireCandidate, asyncHandler(me));

export default router;
