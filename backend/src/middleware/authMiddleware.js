import jwt from "jsonwebtoken";
import { sendError } from "../utils/responseFormatter.js";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    sendError(res, "Authentication token is required", 401);
    return;
  }

  req.user = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
  next();
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    sendError(res, "You do not have permission to access this resource", 403);
    return;
  }

  next();
};
