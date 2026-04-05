import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireFullAccess } from "../middleware/firstLogin.middleware.js";
import { isAdmin } from "../middleware/role.middleware.js";
import {
  listUsersValidators,
  createUserValidators,
  userIdParam,
} from "../validators/users.validators.js";

const router = Router();

router.use(requireAuth, requireFullAccess, isAdmin);

router.get("/", listUsersValidators, validateRequest, usersController.listUsers);
router.post("/", createUserValidators, validateRequest, usersController.createUser);
router.get("/:id", userIdParam, validateRequest, usersController.getUserById);
router.patch("/:id/deactivate", userIdParam, validateRequest, usersController.deactivateUser);
router.patch("/:id/activate", userIdParam, validateRequest, usersController.activateUser);
router.delete("/:id", userIdParam, validateRequest, usersController.deleteUser);
export default router;
