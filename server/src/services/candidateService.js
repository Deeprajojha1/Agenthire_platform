import Candidate from "../models/Candidate.js";
import { getJob } from "./jobService.js";
import { startWorkflowForCandidate } from "./workflowService.js";

export async function uploadCandidate(payload, file) {
  if (!file) {
    const error = new Error("Resume PDF is required");
    error.statusCode = 400;
    throw error;
  }
  const job = await getJob(payload.job_id);
  const candidate = await Candidate.create({
    ...payload,
    job_id: job._id,
    resume_url: file.path
  });
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
