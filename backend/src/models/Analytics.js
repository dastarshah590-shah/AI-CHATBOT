import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, index: true },
    totalConversations: { type: Number, default: 0 },
    resolvedByAI: { type: Number, default: 0 },
    escalatedToHuman: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    topQuestions: { type: Array, default: [] },
    languagesUsed: { type: Array, default: [] }
  },
  { timestamps: true }
);

export const Analytics = mongoose.model("Analytics", analyticsSchema);
