import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/agenthire",
  JWT_SECRET: process.env.JWT_SECRET || "development-secret",
  QDRANT_URL: process.env.QDRANT_URL || "http://localhost:6333",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:3000"
};
