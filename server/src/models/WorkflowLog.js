import mongoose from "mongoose";

const workflowLogSchema = new mongoose.Schema(
  {
    workflow_id: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow", required: true },
    agent_name: { type: String, required: true },
    input: Object,
    output: Object,
    status: { type: String, enum: ["running", "success", "failed", "waiting_approval"], required: true },
    error: Object
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("WorkflowLog", workflowLogSchema);
