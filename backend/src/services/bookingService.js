import { z } from "zod";
import { isMongoConnected } from "../config/db.js";
import { memoryStore } from "../data/memoryStore.js";
import { Booking } from "../models/Booking.js";
import { normalizeDoc } from "../utils/responseFormatter.js";

const bookingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  serviceType: z.string().min(2),
  preferredDate: z.coerce.date(),
  preferredTime: z.string().min(2),
  notes: z.string().optional(),
  conversationId: z.string().optional(),
  customerId: z.string().optional()
});

export const validateBookingPayload = (payload) => bookingSchema.parse(payload);

export const createBooking = async (payload) => {
  const validated = validateBookingPayload(payload);

  if (isMongoConnected()) {
    return normalizeDoc(await Booking.create(validated));
  }

  return memoryStore.bookings.create(validated);
};

export const listBookings = async () => {
  if (isMongoConnected()) {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return bookings.map(normalizeDoc);
  }

  return memoryStore.bookings.list();
};

export const updateBookingStatus = async (id, status) => {
  if (isMongoConnected()) {
    return normalizeDoc(await Booking.findByIdAndUpdate(id, { status }, { new: true }));
  }

  return memoryStore.bookings.update(id, { status });
};
