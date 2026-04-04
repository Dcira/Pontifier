import { validationResult } from "express-validator";
import { AppError } from "../utils/appError.js";

export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const mapped = errors.array().map((e) => ({
      path: e.path,
      msg: e.msg,
      value: e.value === undefined ? undefined : e.value,
    }));
    return next(new AppError(400, "Validation failed", mapped));
  }
  next();
}
