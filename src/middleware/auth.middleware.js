import { verifyAccessToken } from "../utils/jwt.utils.js";
import { AppError } from "../utils/appError.js";
import { selectUserById } from "../queries/auth.queries.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication required");
    }
    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    const userId = decoded.sub;
    if (!userId) {
      throw new AppError(401, "Invalid token payload");
    }
    const user = await selectUserById(userId);
    if (!user || !user.is_active) {
      throw new AppError(401, "User not found or inactive");
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      college_id: user.college_id,
      college_code: user.college_code,
      college_name: user.college_name,
      is_first_login: user.is_first_login,
      is_active: user.is_active,
    };
    req.accessToken = token;
    next();
  } catch (e) {
    next(e);
  }
}
