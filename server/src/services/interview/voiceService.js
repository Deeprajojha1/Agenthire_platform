import fs from "fs";
import path from "path";
import { env } from "../../config/env.js";
import { loadSpec } from "../../utils/specLoader.js";

const interviewsDir = path.resolve(process.cwd(), "interviews");

function ensureInterviewDir(interviewId) {
  const target = path.join(interviewsDir, String(interviewId));
  fs.mkdirSync(target, { recursive: true });
  return target;
}

function audioUrlFromMurfResponse(data) {
  return data?.audioFile || data?.audio_url || data?.audioUrl || data?.url || data?.data?.audio_url || null;
}

export async function synthesizeQuestionAudio({ interviewId, questionId, text }) {
  const spec = loadSpec("interview/voice-config.json");
  if (!env.MURF_API_KEY) {
    return { provider: "text-fallback", fallback: true, audio_url: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), spec.timeout_ms || 15000);
  try {
    const response = await fetch(env.MURF_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": env.MURF_API_KEY,
        Authorization: `Bearer ${env.MURF_API_KEY}`
      },
      body: JSON.stringify({
        text,
        voiceId: env.MURF_VOICE_ID || spec.voice_id,
        voice_id: env.MURF_VOICE_ID || spec.voice_id,
        format: spec.format || "mp3"
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Murf request failed with status ${response.status}`);
    const data = await response.json();
    const remoteUrl = audioUrlFromMurfResponse(data);
    if (!remoteUrl) throw new Error("Murf response did not include an audio URL");
    return {
      provider: "murf",
      fallback: false,
      audio_url: remoteUrl,
      raw: data
    };
  } catch (error) {
    return {
      provider: "text-fallback",
      fallback: true,
      audio_url: null,
      error: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadToAssemblyAI(filePath) {
  const stream = fs.createReadStream(filePath);
  const response = await fetch(env.ASSEMBLYAI_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: env.ASSEMBLYAI_API_KEY },
    body: stream,
    duplex: "half"
  });
  if (!response.ok) throw new Error(`AssemblyAI upload failed with status ${response.status}`);
  const data = await response.json();
  if (!data.upload_url) throw new Error("AssemblyAI upload response did not include upload_url");
  return data.upload_url;
}

async function requestTranscript(audioUrl) {
  const response = await fetch(env.ASSEMBLYAI_TRANSCRIPT_URL, {
    method: "POST",
    headers: {
      Authorization: env.ASSEMBLYAI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ audio_url: audioUrl })
  });
  if (!response.ok) throw new Error(`AssemblyAI transcript request failed with status ${response.status}`);
  const data = await response.json();
  if (!data.id) throw new Error("AssemblyAI transcript response did not include id");
  return data.id;
}

async function pollTranscript(transcriptId) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`${env.ASSEMBLYAI_TRANSCRIPT_URL}/${transcriptId}`, {
      headers: { Authorization: env.ASSEMBLYAI_API_KEY }
    });
    if (!response.ok) throw new Error(`AssemblyAI transcript poll failed with status ${response.status}`);
    const data = await response.json();
    if (data.status === "completed") {
      return {
        rawTranscript: data.text || "",
        cleanTranscript: data.text || "",
        confidenceScore: typeof data.confidence === "number" ? Math.round(data.confidence * 100) : null,
        raw: data
      };
    }
    if (data.status === "error") throw new Error(data.error || "AssemblyAI transcription failed");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("AssemblyAI transcription timed out");
}

export function persistRecording({ interviewId, questionId, file }) {
  if (!file) return null;
  const targetDir = ensureInterviewDir(interviewId);
  const extension = path.extname(file.originalname || "") || ".webm";
  const target = path.join(targetDir, `${questionId}-${Date.now()}${extension}`);
  fs.renameSync(file.path, target);
  return target;
}

export async function transcribeRecording(filePath, manualText = "") {
  if (!filePath || !env.ASSEMBLYAI_API_KEY) {
    return {
      provider: "manual-fallback",
      fallback: true,
      rawTranscript: manualText,
      cleanTranscript: manualText,
      confidenceScore: null
    };
  }

  try {
    const audioUrl = await uploadToAssemblyAI(filePath);
    const transcriptId = await requestTranscript(audioUrl);
    const transcript = await pollTranscript(transcriptId);
    return {
      provider: "assemblyai",
      fallback: false,
      ...transcript
    };
  } catch (error) {
    return {
      provider: "manual-fallback",
      fallback: true,
      rawTranscript: manualText,
      cleanTranscript: manualText,
      confidenceScore: null,
      error: error.message
    };
  }
}
