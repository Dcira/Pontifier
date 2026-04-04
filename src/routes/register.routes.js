import { Router } from "express";
import * as registerController from "../controllers/register.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireFullAccess } from "../middleware/firstLogin.middleware.js";
import { isAnyAuthenticated } from "../middleware/role.middleware.js";
import { getRegisterValidators, postRegisterValidators } from "../validators/register.validators.js";

const router = Router();

router.use(requireAuth, requireFullAccess, isAnyAuthenticated);

router.get("/", getRegisterValidators, validateRequest, registerController.getRegister);
router.post("/", postRegisterValidators, validateRequest, registerController.postRegister);

export default router;
