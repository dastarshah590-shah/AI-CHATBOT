import { agentReply, escalateConversation, handleCustomerMessage } from "../services/chatService.js";

export const chatSocket = (io) => {
  io.on("connection", (socket) => {
    socket.on("join_conversation", (conversationId) => {
      if (conversationId) {
        socket.join(conversationId);
      }
    });

    socket.on("send_message", async (data, callback) => {
      try {
        const result = await handleCustomerMessage(data);
        socket.join(result.conversationId);
        io.to(result.conversationId).emit("receive_message", result.customerMessage);
        io.to(result.conversationId).emit("bot_reply", result.botMessage);

        if (result.escalated) {
          io.emit("conversation_escalated", {
            conversationId: result.conversationId,
            reason: "Escalation requested"
          });
        }

        callback?.({
          success: true,
          conversationId: result.conversationId,
          reply: result.reply,
          escalated: result.escalated
        });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("typing", ({ conversationId, senderType }) => {
      socket.to(conversationId).emit("typing_status", { senderType, isTyping: true });
    });

    socket.on("request_handoff", async ({ conversationId, reason }, callback) => {
      try {
        await escalateConversation({ conversationId, reason });
        io.emit("conversation_escalated", { conversationId, reason });
        io.to(conversationId).emit("conversation_escalated", { conversationId, reason });
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("agent_reply", async ({ conversationId, message, agentId }, callback) => {
      try {
        const reply = await agentReply({ conversationId, message, agentId });
        io.to(conversationId).emit("receive_message", reply);
        callback?.({ success: true, message: reply });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });
  });
};
