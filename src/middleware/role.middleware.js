import { AppError } from "../utils/appError.js";

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions"));
    }
    next();
  };
}

export const isAdmin = requireRoles("admin");
export const isAdminOrCollegeManager = requireRoles("admin", "college_manager");
export const isAnyAuthenticated = requireRoles("admin", "college_manager", "team_member");
