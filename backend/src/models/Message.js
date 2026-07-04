import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    senderType: {
      type: String,
      enum: ["customer", "bot", "agent"],
      required: true
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    intent: { type: String },
    confidence: { type: Number, default: 1 },
    isEscalated: { type: Boolean, default: false }
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ message: "text" });

export const Message = mongoose.model("Message", messageSchema);
