import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    serviceType: { type: String, required: true, trim: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

bookingSchema.index({ preferredDate: 1, status: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
