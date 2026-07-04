import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["active", "escalated", "resolved", "closed"],
      default: "active",
      index: true
    },
    source: { type: String, default: "website" },
    language: { type: String, default: "en" },
    escalationReason: { type: String },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    satisfactionRating: { type: Number, min: 1, max: 5 }
  },
  { timestamps: true }
);

conversationSchema.index({ createdAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
