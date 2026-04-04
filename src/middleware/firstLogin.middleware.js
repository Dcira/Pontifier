import { AppError } from "../utils/appError.js";

export function requireFullAccess(req, res, next) {
  if (req.user?.is_first_login) {
    return next(new AppError(403, "You must change your password before using this resource"));
  }
  next();
}
