import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ["intro", "behavioral", "technical", "coding"], required: true },
    prompt: { type: String, required: true },
    source: { type: String, enum: ["interview_document", "job_description", "resume", "general_knowledge"], default: "general_knowledge" },
    documentName: String,
    chunkId: String,
    similarity: Number,
    documentReference: Object,
    retrievedChunks: [Object],
    coding_task: String,
    language: String,
    audio_url: String,
    audio_provider: String,
    audio_fallback: { type: Boolean, default: false },
    asked_at: Date
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    question_id: { type: String, required: true },
    raw_transcript: String,
    clean_transcript: String,
    confidence_score: Number,
    manual_text: String,
    code: String,
    language: String,
    recording_path: String,
    answered_at: Date,
    duration: Number,
    assembly_provider: String,
    transcription_fallback: { type: Boolean, default: false }
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true, index: true },
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    workflow_id: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true, index: true },
    role: String,
    difficulty: { type: String, enum: ["starter", "standard", "advanced", "expert"], default: "standard" },
    preferred_language: { type: String, default: "javascript" },
    status: { type: String, enum: ["scheduled", "ready", "in_progress", "completed"], default: "scheduled" },
    scheduled_at: Date,
    ends_at: Date,
    started_at: Date,
    completed_at: Date,
    questions: [questionSchema],
    questionSource: { type: Object, default: {} },
    documentReference: { type: Object, default: null },
    retrievedChunks: [Object],
    retrievalMetadata: { type: Object, default: null },
    answers: [answerSchema],
    messages: [{ role: String, content: String, created_at: Date }],
    evaluation: { type: Object, default: null },
    overall_score: Number,
    recommendation: String
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Interview", interviewSchema);
