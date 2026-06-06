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
import candidateAuthRoutes from "./routes/candidate/authRoutes.js";
import candidatePortalRoutes from "./routes/candidate/portalRoutes.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { jsonResponse } from "./utils/response.js";

export function createApp() {
  const app = express();
  const allowedOrigins = new Set([
    ...env.CLIENT_ORIGINS,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
  ]);

  app.use(helmet());
  app.use(cors({
    credentials: true,
    origin(origin, callback) {
      const isLocalNetworkDev = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+):300\d$/.test(origin || "");
      if (!origin || allowedOrigins.has(origin) || isLocalNetworkDev) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  }));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
  app.use(express.json({ limit: "1mb" }));
  app.use(mongoSanitize());

  app.get("/health", (req, res) => jsonResponse(res, { status: "healthy" }));
  app.use("/auth", authRoutes);
  app.use("/candidate/auth", candidateAuthRoutes);
  app.use("/candidate", candidatePortalRoutes);
  app.use("/jobs", jobRoutes);
  app.use("/candidates", candidateRoutes);
  app.use("/workflow", workflowRoutes);
  app.use("/analytics", analyticsRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
