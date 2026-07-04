import { Router } from "express";
import { getDashboard } from "../controllers/analyticsController.js";
import { protect, requireRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard", protect, requireRoles("admin", "super_admin"), getDashboard);

export default router;
