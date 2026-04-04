import { AppError } from "../utils/appError.js";
import { errorResponse } from "../utils/response.utils.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(errorResponse(err.message, err.errors));
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(errorResponse("Invalid or malformed token"));
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(errorResponse("Token expired"));
  }

  if (err.code === "23505") {
    return res.status(409).json(errorResponse("Duplicate entry"));
  }

  const isDev = process.env.NODE_ENV === "development";
  const message = isDev ? err.message || "Internal server error" : "Internal server error";

  console.error(err);

  return res.status(500).json(errorResponse(message));
}
