import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["customer", "admin", "agent", "super_admin"],
      default: "customer"
    },
    passwordHash: { type: String, required: true, select: false },
    language: { type: String, default: "en" }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
