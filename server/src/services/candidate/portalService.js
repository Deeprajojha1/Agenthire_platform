import Candidate from "../../models/Candidate.js";
import Job from "../../models/Job.js";
import Notification from "../../models/Notification.js";
import Interview from "../../models/Interview.js";
import Workflow from "../../models/Workflow.js";
import WorkflowLog from "../../models/WorkflowLog.js";
import { loadSpec } from "../../utils/specLoader.js";

const workflowStepMap = {
  resume_parser: "Resume Upload",
  embedding_agent: "AI Screening",
  matching_agent: "AI Screening",
  shortlisting_agent: "AI Screening",
  human_approval: "Recruiter Review",
  interview_agent: "Interview",
  email_agent: "Final Decision",
  completed: "Final Decision"
};

function candidateEmail(user) {
  return user.email.trim().toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactText(value) {
  return new RegExp(`^${escapeRegExp(value.trim())}$`, "i");
}

function matchScoreBreakdown(workflow) {
  const match = workflow?.context?.match || {};
  return {
    overall: match.match_score ?? null,
    skills: match.match_score ?? null,
    experience: match.experience_met === undefined ? null : match.experience_met ? 100 : 0,
    education: null
  };
}

function rejectionReason(candidate, workflow) {
  if (!["reject", "rejected"].includes(candidate.status)) return null;
  const match = workflow?.context?.match || {};
  const parsedResume = workflow?.context?.parsedResume || candidate.parsed_resume_json || {};
  const job = candidate.job_id || {};
  return {
    matched_skills: [...(match.matched_required_skills || []), ...(match.matched_preferred_skills || [])],
    missing_skills: match.missing_skills || [],
    required_experience: job.min_experience ?? null,
    candidate_experience: parsedResume.experience ?? null,
    education_gap: "Not available",
    final_match_score: match.match_score ?? candidate.match_score ?? null
  };
}

function workflowSteps(workflow) {
  const order = ["Resume Upload", "AI Screening", "Recruiter Review", "Interview", "Final Decision"];
  const current = workflowStepMap[workflow?.current_state] || "Resume Upload";
  const currentIndex = order.indexOf(current);
  return order.map((label, index) => ({
    label,
    status: index < currentIndex || workflow?.status === "completed" ? "completed" : index === currentIndex ? "current" : "pending"
  }));
}

function interviewDetails(workflow) {
  if (!workflow) return null;
  const scheduledAt = workflow.interview_scheduled_at || workflow.context?.interviewScheduledAt || null;
  const material = workflow.context?.interview || null;
  if (!scheduledAt && !material) return null;
  return {
    scheduled_at: scheduledAt,
    difficulty: workflow.interview_difficulty || workflow.context?.interviewDifficulty || "standard",
    material
  };
}

function applicationSummary(candidate, workflow) {
  return {
    id: candidate._id,
    candidate: {
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone
    },
    job: candidate.job_id,
    applied_at: candidate.created_at,
    status: candidate.status,
    match_score: candidate.match_score,
    current_step: workflowStepMap[workflow?.current_state] || "Resume Upload",
    workflow_status: workflow?.status || "pending"
  };
}

function matchesSearch(candidate, query) {
  if (!query) return true;
  const value = query.trim().toLowerCase();
  if (!value) return true;
  const fields = [
    candidate.name,
    candidate.email,
    candidate.phone,
    candidate.job_id?.title,
    candidate.job_id?.description,
    candidate.status
  ];
  return fields.some((field) => String(field || "").toLowerCase().includes(value));
}

function jobMatchesSearch(job, query) {
  if (!query) return true;
  const value = query.trim().toLowerCase();
  if (!value) return true;
  const fields = [
    job.title,
    job.description,
    ...(job.required_skills || []),
    ...(job.preferred_skills || [])
  ];
  return fields.some((field) => String(field || "").toLowerCase().includes(value));
}

function jobSummary(job, appliedJobIds) {
  const id = job._id.toString();
  return {
    id: job._id,
    title: job.title,
    description: job.description,
    required_skills: job.required_skills || [],
    preferred_skills: job.preferred_skills || [],
    min_experience: job.min_experience,
    application_deadline: job.application_deadline,
    created_at: job.created_at,
    already_applied: appliedJobIds.has(id)
  };
}

async function candidateApplications(user, search = "") {
  const email = candidateEmail(user);
  const claimFilter = { email: exactText(email) };
  const candidates = await Candidate.find({
    $or: [
      { candidate_user_id: user._id },
      { email: exactText(email) }
    ]
  }).populate("job_id").sort({ created_at: -1 });
  await Candidate.updateMany(claimFilter, { candidate_user_id: user._id });
  const workflows = await Workflow.find({ candidate_id: { $in: candidates.map((candidate) => candidate._id) } });
  const workflowByCandidate = new Map(workflows.map((workflow) => [workflow.candidate_id.toString(), workflow]));
  return candidates
    .filter((candidate) => matchesSearch(candidate, search))
    .map((candidate) => ({ candidate, workflow: workflowByCandidate.get(candidate._id.toString()) }));
}

async function findOwnedApplication(user, applicationId) {
  const email = candidateEmail(user);
  const candidate = await Candidate.findOne({
    _id: applicationId,
    $or: [
      { candidate_user_id: user._id },
      { email: exactText(email) }
    ]
  }).populate("job_id");
  if (!candidate) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }
  const workflow = await Workflow.findOne({ candidate_id: candidate._id }).populate("job_id");
  return { candidate, workflow };
}

export async function dashboard(user, search = "") {
  const applications = await candidateApplications(user, search);
  const unread_count = await Notification.countDocuments({ user_id: user._id, read_at: null });
  return {
    applications: applications.map(({ candidate, workflow }) => applicationSummary(candidate, workflow)),
    unread_count
  };
}

export async function jobs(user, search = "") {
  const applications = await candidateApplications(user);
  const appliedJobIds = new Set(applications.map(({ candidate }) => candidate.job_id?._id?.toString()).filter(Boolean));
  const jobs = await Job.find().sort({ created_at: -1 });
  return {
    jobs: jobs.filter((job) => jobMatchesSearch(job, search)).map((job) => jobSummary(job, appliedJobIds))
  };
}

export async function applicationDetails(user, applicationId) {
  const { candidate, workflow } = await findOwnedApplication(user, applicationId);
  const logs = workflow ? await WorkflowLog.find({ workflow_id: workflow._id }).sort({ created_at: 1 }) : [];
  return {
    application: {
      ...applicationSummary(candidate, workflow),
      recruiter_decision: workflow?.approval_status || "pending",
      workflow_steps: workflowSteps(workflow),
      match_score_breakdown: matchScoreBreakdown(workflow),
      interview: interviewDetails(workflow),
      rejection_reason: rejectionReason(candidate, workflow)
    },
    timeline: logs.map((log) => ({
      id: log._id,
      event: log.agent_name,
      status: log.status,
      created_at: log.created_at
    }))
  };
}

export async function listNotifications(user) {
  const notifications = await Notification.find({ user_id: user._id }).sort({ created_at: -1 });
  const unread_count = notifications.filter((notification) => !notification.read_at).length;
  const applications = await candidateApplications(user);
  const workflows = await Workflow.find({ candidate_id: { $in: applications.map(({ candidate }) => candidate._id) } });
  const workflowByCandidate = new Map(workflows.map((workflow) => [workflow.candidate_id.toString(), workflow]));
  const interviews = await Interview.find({ candidate_id: { $in: applications.map(({ candidate }) => candidate._id) } });
  const interviewByCandidate = new Map(interviews.map((interview) => [interview.candidate_id.toString(), interview]));
  const logs = await WorkflowLog.find({ workflow_id: { $in: workflows.map((workflow) => workflow._id) } }).sort({ created_at: 1 });
  const logsByWorkflow = new Map();
  for (const log of logs) {
    const key = log.workflow_id.toString();
    logsByWorkflow.set(key, [...(logsByWorkflow.get(key) || []), log]);
  }

  return {
    notifications,
    unread_count,
    node_state_spec: loadSpec("workflow/node-states.json"),
    applications: applications.map(({ candidate }) => {
      const workflow = workflowByCandidate.get(candidate._id.toString());
      const interview = interviewByCandidate.get(candidate._id.toString()) || null;
      return {
        application: applicationSummary(candidate, workflow),
        workflow,
        interview,
        timeline: workflow ? (logsByWorkflow.get(workflow._id.toString()) || []).map((log) => ({
          id: log._id,
          event: log.agent_name,
          status: log.status,
          created_at: log.created_at
        })) : []
      };
    })
  };
}

export async function markNotificationRead(user, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user_id: user._id },
    { read_at: new Date() },
    { new: true }
  );
  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }
  return { notification };
}

export async function markAllNotificationsRead(user) {
  await Notification.updateMany({ user_id: user._id, read_at: null }, { read_at: new Date() });
  return { updated: true };
}
