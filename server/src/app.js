import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import workflowRoutes from "./routes/workflowRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { jsonResponse } from "./utils/response.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
  app.use(express.json({ limit: "1mb" }));
  app.use(mongoSanitize());

  app.get("/health", (req, res) => jsonResponse(res, { status: "healthy" }));
  app.use("/auth", authRoutes);
  app.use("/jobs", jobRoutes);
  app.use("/candidates", candidateRoutes);
  app.use("/workflow", workflowRoutes);
  app.use("/analytics", analyticsRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
