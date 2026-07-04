import { z } from "zod";
import { createBooking, listBookings, updateBookingStatus } from "../services/bookingService.js";
import { asyncHandler, sendError, sendSuccess } from "../utils/responseFormatter.js";

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "rejected", "cancelled"])
});

export const addBooking = asyncHandler(async (req, res) => {
  const booking = await createBooking(req.body);
  sendSuccess(res, { message: "Booking request submitted successfully", booking }, 201);
});

export const getBookings = asyncHandler(async (_req, res) => {
  const bookings = await listBookings();
  sendSuccess(res, { bookings });
});

export const editBookingStatus = asyncHandler(async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  const booking = await updateBookingStatus(req.params.id, status);

  if (!booking) {
    sendError(res, "Booking not found", 404);
    return;
  }

  sendSuccess(res, { message: "Booking status updated successfully", booking });
});
