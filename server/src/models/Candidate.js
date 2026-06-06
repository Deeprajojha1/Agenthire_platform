import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    resume_url: { type: String, required: true },
    parsed_resume_json: { type: Object, default: null },
    match_score: { type: Number, default: null },
    status: { type: String, default: "submitted" }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

candidateSchema.index({ job_id: 1, email: 1 }, { unique: true });

export default mongoose.model("Candidate", candidateSchema);
