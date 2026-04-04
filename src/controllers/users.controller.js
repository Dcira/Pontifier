import {
  insertUser,
  selectUsersFiltered,
  selectUserDetailStats,
  setUserActive,
} from "../queries/users.queries.js";
import { hashPassword, generateTempPassword } from "../utils/password.utils.js";
import { successResponse } from "../utils/response.utils.js";
import { AppError } from "../utils/appError.js";

export async function listUsers(req, res, next) {
  try {
    const { role, college_id, is_active } = req.query;
    const rows = await selectUsersFiltered({ role, collegeId: college_id, isActive: is_active });
    res.json(successResponse({ users: rows }));
  } catch (e) {
    next(e);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, email, role, college_id } = req.body;
    if (role === "college_manager" && (college_id === undefined || college_id === null)) {
      throw new AppError(400, "college_id is required for college_manager");
    }
    if (role !== "college_manager" && college_id) {
      throw new AppError(400, "college_id must not be set for this role");
    }
    const plain = generateTempPassword();
    const passwordHash = await hashPassword(plain);
    const row = await insertUser({
      name,
      email,
      passwordHash,
      role,
      collegeId: role === "college_manager" ? college_id : null,
      createdBy: req.user.id,
    });
    res.status(201).json(
      successResponse({
        user: row,
        temporary_password: plain,
      })
    );
  } catch (e) {
    next(e);
  }
}

export async function deactivateUser(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      throw new AppError(400, "You cannot deactivate your own account");
    }
    const updated = await setUserActive(id, false);
    if (!updated) {
      throw new AppError(404, "User not found");
    }
    res.json(successResponse({ user: updated }));
  } catch (e) {
    next(e);
  }
}

export async function activateUser(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await setUserActive(id, true);
    if (!updated) {
      throw new AppError(404, "User not found");
    }
    res.json(successResponse({ user: updated }));
  } catch (e) {
    next(e);
  }
}

export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const detail = await selectUserDetailStats(id);
    if (!detail) {
      throw new AppError(404, "User not found");
    }
    res.json(successResponse({ user: detail }));
  } catch (e) {
    next(e);
  }
}
