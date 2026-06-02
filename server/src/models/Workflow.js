import mongoose from "mongoose";

const nodeStateSchema = new mongoose.Schema(
  {
    name: String,
    status: String,
    attempts: { type: Number, default: 0 },
    error: Object,
    output: Object,
    started_at: Date,
    completed_at: Date
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    current_state: { type: String, default: "pending" },
    status: { type: String, enum: ["pending", "running", "waiting_approval", "completed", "failed"], default: "pending" },
    approval_status: { type: String, enum: ["pending", "approved", "rejected", "not_required"], default: "pending" },
    execution_order: [{ type: String }],
    node_states: [nodeStateSchema],
    retry_count: { type: Number, default: 0 },
    context: { type: Object, default: {} }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Workflow", workflowSchema);
