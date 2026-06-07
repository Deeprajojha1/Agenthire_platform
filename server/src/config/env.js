import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/agenthire",
  JWT_SECRET: process.env.JWT_SECRET || "development-secret",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
  QDRANT_URL: process.env.QDRANT_URL || "http://localhost:6333",
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || "",
  MURF_API_KEY: process.env.MURF_API_KEY || "",
  MURF_TTS_URL: process.env.MURF_TTS_URL || "https://api.murf.ai/v1/speech/generate",
  MURF_VOICE_ID: process.env.MURF_VOICE_ID || "en-US-natalie",
  ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY || "",
  ASSEMBLYAI_UPLOAD_URL: process.env.ASSEMBLYAI_UPLOAD_URL || "https://api.assemblyai.com/v2/upload",
  ASSEMBLYAI_TRANSCRIPT_URL: process.env.ASSEMBLYAI_TRANSCRIPT_URL || "https://api.assemblyai.com/v2/transcript",
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "AgentHire <onboarding@resend.dev>",
  RESEND_TEST_TO: process.env.RESEND_TEST_TO || "",
  RESEND_TEST_REDIRECT: process.env.RESEND_TEST_REDIRECT === "true",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};
