import { Router } from "express";
import { addFAQ, editFAQ, getFAQs, removeFAQ } from "../controllers/faqController.js";
import { protect, requireRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getFAQs);
router.post("/", protect, requireRoles("admin", "super_admin"), addFAQ);
router.put("/:id", protect, requireRoles("admin", "super_admin"), editFAQ);
router.delete("/:id", protect, requireRoles("admin", "super_admin"), removeFAQ);

export default router;
