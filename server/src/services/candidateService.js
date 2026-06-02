import { unlink } from "fs/promises";
import Candidate from "../models/Candidate.js";
import { getJob } from "./jobService.js";
import { startWorkflowForCandidate } from "./workflowService.js";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function removeUploadedFile(file) {
  if (!file?.path) return;
  try {
    await unlink(file.path);
  } catch {
    // Best-effort cleanup for rejected duplicate uploads.
  }
}

export async function checkApplication(payload) {
  const job = await getJob(payload.job_id);
  const existing = await Candidate.findOne({ job_id: job._id, email: normalizeEmail(payload.email) }).select("_id status created_at");
  return {
    already_applied: Boolean(existing),
    candidate: existing || null
  };
}

export async function uploadCandidate(payload, file) {
  if (!file) {
    const error = new Error("Resume PDF is required");
    error.statusCode = 400;
    throw error;
  }
  const job = await getJob(payload.job_id);
  const email = normalizeEmail(payload.email);
  const existing = await Candidate.findOne({ job_id: job._id, email }).select("_id");
  if (existing) {
    await removeUploadedFile(file);
    const error = new Error("You have already applied for this job with this email.");
    error.statusCode = 409;
    throw error;
  }
  let candidate;
  try {
    candidate = await Candidate.create({
      ...payload,
      email,
      job_id: job._id,
      resume_url: file.path
    });
  } catch (error) {
    if (error.code === 11000) {
      await removeUploadedFile(file);
      const duplicateError = new Error("You have already applied for this job with this email.");
      duplicateError.statusCode = 409;
      throw duplicateError;
    }
    throw error;
  }
  const workflow = await startWorkflowForCandidate(candidate._id, job._id);
  return { candidate, workflow };
}

export async function listCandidates() {
  return Candidate.find().populate("job_id").sort({ created_at: -1 });
}

export async function getCandidate(id) {
  const candidate = await Candidate.findById(id).populate("job_id");
  if (!candidate) {
    const error = new Error("Candidate not found");
    error.statusCode = 404;
    throw error;
  }
  return candidate;
}
