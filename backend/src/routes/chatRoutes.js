import { Router } from "express";
import {
  escalate,
  getConversationHistory,
  getConversations,
  replyAsAgent,
  resolveConversation,
  sendMessage
} from "../controllers/chatController.js";
import { protect, requireRoles } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/message", sendMessage);
router.get("/conversations", protect, requireRoles("admin", "agent", "super_admin"), getConversations);
router.get("/conversations/:conversationId", getConversationHistory);
router.post("/escalate", escalate);
router.post(
  "/conversations/:conversationId/agent-reply",
  protect,
  requireRoles("agent", "admin", "super_admin"),
  replyAsAgent
);
router.post("/conversations/:conversationId/resolve", resolveConversation);

export default router;
