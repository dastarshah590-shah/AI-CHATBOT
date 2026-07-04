import { sendError } from "../utils/responseFormatter.js";

export const notFoundMiddleware = (req, res) => {
  sendError(res, `Route not found: ${req.originalUrl}`, 404);
};

export const errorMiddleware = (error, _req, res, _next) => {
  console.error(error);

  if (error.name === "ZodError") {
    sendError(res, "Validation failed", 422, error.flatten());
    return;
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    sendError(res, "Invalid or expired token", 401);
    return;
  }

  sendError(res, error.message || "Unexpected server error", error.statusCode || 500);
};
