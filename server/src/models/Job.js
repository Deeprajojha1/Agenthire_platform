import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    required_skills: [{ type: String, trim: true }],
    preferred_skills: [{ type: String, trim: true }],
    min_experience: { type: Number, default: 0 },
    application_deadline: { type: Date, default: null },
    workflow_spec_id: { type: String, default: "default-hiring-workflow" },
    hiring_spec_id: { type: String, default: "frontend-developer" },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Job", jobSchema);
