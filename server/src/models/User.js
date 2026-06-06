import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["candidate", "recruiter", "admin"], default: "candidate" },
    candidateProfile: {
      phone: { type: String, trim: true },
      headline: { type: String, trim: true },
      location: { type: String, trim: true }
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("User", userSchema);
