import { Router } from "express";
import * as schoolsController from "../controllers/schools.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireFullAccess } from "../middleware/firstLogin.middleware.js";
import { isAnyAuthenticated } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth, requireFullAccess, isAnyAuthenticated);

router.get("/", schoolsController.listSchools);

export default router;
