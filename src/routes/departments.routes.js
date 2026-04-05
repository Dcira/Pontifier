import { Router } from "express";
import * as departmentsController from "../controllers/departments.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireFullAccess } from "../middleware/firstLogin.middleware.js";
import { isAnyAuthenticated } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth, requireFullAccess, isAnyAuthenticated);

router.get("/", departmentsController.listDepartments);

export default router;
