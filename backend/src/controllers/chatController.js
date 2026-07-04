import { z } from "zod";
import {
  agentReply,
  closeConversation,
  escalateConversation,
  getConversation,
  getMessages,
  handleCustomerMessage,
  listConversations
} from "../services/chatService.js";
import { asyncHandler, sendError, sendSuccess } from "../utils/responseFormatter.js";

const messageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1),
  customerId: z.string().optional(),
  source: z.string().default("website")
});

const escalationSchema = z.object({
  conversationId: z.string().min(1),
  reason: z.string().default("Customer requested human support")
});

export const sendMessage = asyncHandler(async (req, res) => {
  const payload = messageSchema.parse(req.body);
  const result = await handleCustomerMessage(payload);
  const io = req.app.get("io");

  io?.to(result.conversationId).emit("bot_reply", result.botMessage);
  if (result.escalated) {
    io?.emit("conversation_escalated", {
      conversationId: result.conversationId,
      reason: "Escalation requested"
    });
  }

  sendSuccess(res, {
    conversationId: result.conversationId,
    reply: result.reply,
    senderType: "bot",
    escalated: result.escalated,
    intent: result.intent,
    confidence: result.confidence,
    booking: result.booking
  });
});

export const getConversationHistory = asyncHandler(async (req, res) => {
  const conversation = await getConversation(req.params.conversationId);

  if (!conversation) {
    sendError(res, "Conversation not found", 404);
    return;
  }

  const messages = await getMessages(conversation.id);
  sendSuccess(res, {
    conversation: {
      ...conversation,
      messages
    }
  });
});

export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await listConversations({ status: req.query.status });
  sendSuccess(res, { conversations });
});

export const escalate = asyncHandler(async (req, res) => {
  const payload = escalationSchema.parse(req.body);
  const result = await escalateConversation(payload);

  if (!result) {
    sendError(res, "Conversation not found", 404);
    return;
  }

  req.app.get("io")?.emit("conversation_escalated", {
    conversationId: payload.conversationId,
    reason: payload.reason
  });

  sendSuccess(res, { message: "Conversation escalated to human support" });
});

export const replyAsAgent = asyncHandler(async (req, res) => {
  const payload = z.object({ message: z.string().min(1) }).parse(req.body);
  const message = await agentReply({
    conversationId: req.params.conversationId,
    message: payload.message,
    agentId: req.user?.id
  });

  if (!message) {
    sendError(res, "Conversation not found", 404);
    return;
  }

  req.app.get("io")?.to(req.params.conversationId).emit("receive_message", message);
  sendSuccess(res, { message: "Agent reply sent", data: message });
});

export const resolveConversation = asyncHandler(async (req, res) => {
  const payload = z.object({ satisfactionRating: z.number().min(1).max(5).optional() }).parse(req.body);
  const conversation = await closeConversation({
    conversationId: req.params.conversationId,
    satisfactionRating: payload.satisfactionRating
  });

  if (!conversation) {
    sendError(res, "Conversation not found", 404);
    return;
  }

  sendSuccess(res, { message: "Conversation resolved", conversation });
});
