import Job from "../models/Job.js";

export async function createJob(payload, user) {
  return Job.create({ ...payload, created_by: user._id });
}

export async function listJobs() {
  return Job.find().sort({ created_at: -1 });
}

export async function getJob(id) {
  const job = await Job.findById(id);
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }
  return job;
}

export async function updateJob(id, payload) {
  const job = await Job.findByIdAndUpdate(id, payload, { new: true });
  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }
  return job;
}
