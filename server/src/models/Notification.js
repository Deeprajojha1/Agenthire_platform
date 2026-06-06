import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    candidate_id: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
    workflow_id: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow" },
    type: {
      type: String,
      enum: ["workflow_update", "interview_update", "recruiter_message", "system_alert"],
      default: "workflow_update"
    },
    event: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read_at: { type: Date, default: null }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

notificationSchema.index({ user_id: 1, read_at: 1, created_at: -1 });

export default mongoose.model("Notification", notificationSchema);
