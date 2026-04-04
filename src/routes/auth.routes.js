import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  loginValidators,
  changePasswordValidators,
  refreshValidators,
  logoutValidators,
} from "../validators/auth.validators.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, loginValidators, validateRequest, authController.login);
router.post("/refresh", refreshLimiter, refreshValidators, validateRequest, authController.refresh);
router.post(
  "/change-password",
  requireAuth,
  changePasswordValidators,
  validateRequest,
  authController.changePassword
);
router.post("/logout", requireAuth, logoutValidators, validateRequest, authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
