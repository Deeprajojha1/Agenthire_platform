import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd(), "..", "specs");

export function loadSpec(relativePath) {
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(root)) {
    throw new Error("Invalid spec path");
  }
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

export function loadHiringSpec(specId = "frontend-developer") {
  return loadSpec(`hiring/${specId}.json`);
}

export function loadWorkflowSpec(specId = "default-hiring-workflow") {
  return loadSpec(`workflow/${specId}.json`);
}

export function mergeJobWithHiringSpec(job, hiringSpec) {
  return {
    ...hiringSpec,
    required_skills: job.required_skills?.length ? job.required_skills : hiringSpec.required_skills,
    preferred_skills: job.preferred_skills?.length ? job.preferred_skills : hiringSpec.preferred_skills,
    min_experience: Number(job.min_experience || 0),
    role: job.title || hiringSpec.role,
    base_role: hiringSpec.role,
    minimum_score: hiringSpec.minimum_score,
    interview_rounds: hiringSpec.interview_rounds
  };
}
