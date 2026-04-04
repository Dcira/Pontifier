import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireFullAccess } from "../middleware/firstLogin.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth, requireFullAccess, isAdmin);

router.get("/stats", dashboardController.getStats);
router.get("/college-breakdown", dashboardController.getCollegeBreakdown);
router.get("/daily-activity", dashboardController.getDailyActivity);
router.get("/recent-activity", dashboardController.getRecentActivity);

router.get("/top-canvassers", dashboardController.getTopCanvassers);
export default router;
