import { Router } from "express";
import multer from "multer";
import * as delegatesController from "../controllers/delegates.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireFullAccess } from "../middleware/firstLogin.middleware.js";
import { isAdmin, isAdminOrCollegeManager, isAnyAuthenticated } from "../middleware/role.middleware.js";
import {
  listDelegatesValidators,
  createDelegateValidators,
  delegateIdParam,
  patchDelegateValidators,
  updateStatusValidators,
  assignValidators,
  teamMemberIdParam,
} from "../validators/delegates.validators.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth, requireFullAccess);

// Import / Export / Template (must be before /:id to avoid conflicts)
router.get("/template", isAdminOrCollegeManager, delegatesController.downloadTemplate);
router.post("/import", isAdminOrCollegeManager, upload.single("file"), delegatesController.importDelegates);
router.get("/export", isAdminOrCollegeManager, delegatesController.exportDelegates);

// Standard CRUD
router.get("/", isAnyAuthenticated, listDelegatesValidators, validateRequest, delegatesController.listDelegates);
router.post("/", isAdmin, createDelegateValidators, validateRequest, delegatesController.createDelegate);
router.get("/:id", isAnyAuthenticated, delegateIdParam, validateRequest, delegatesController.getDelegate);
router.patch("/:id", isAdminOrCollegeManager, delegateIdParam, patchDelegateValidators, validateRequest, delegatesController.patchDelegate);
router.patch("/:id/status", isAdminOrCollegeManager, delegateIdParam, updateStatusValidators, validateRequest, delegatesController.patchDelegateStatus);
router.post("/:id/assign", isAdmin, delegateIdParam, assignValidators, validateRequest, delegatesController.assignDelegate);
router.delete("/:id/assign/:team_member_id", isAdmin, delegateIdParam, teamMemberIdParam, validateRequest, delegatesController.unassignDelegate);

export default router;