import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    language: { type: String, default: "en" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

faqSchema.index({ question: "text", answer: "text", category: "text" });
faqSchema.index({ isActive: 1, language: 1 });

export const FAQ = mongoose.model("FAQ", faqSchema);
