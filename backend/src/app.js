import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import faqRoutes from "./routes/faqRoutes.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware.js";

export const createApp = () => {
  const app = express();
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      message: "SmartBot AI API is running",
      storage: global.smartbotStorageMode || "memory"
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/faqs", faqRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/analytics", analyticsRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
