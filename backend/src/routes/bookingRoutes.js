import { Router } from "express";
import { addBooking, editBookingStatus, getBookings } from "../controllers/bookingController.js";
import { protect, requireRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", addBooking);
router.get("/", protect, requireRoles("admin", "agent", "super_admin"), getBookings);
router.put("/:id/status", protect, requireRoles("admin", "agent", "super_admin"), editBookingStatus);

export default router;
