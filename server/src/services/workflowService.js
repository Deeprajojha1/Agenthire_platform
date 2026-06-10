import mongoose from "mongoose";
import Workflow from "../models/Workflow.js";
import WorkflowLog from "../models/WorkflowLog.js";
import Candidate from "../models/Candidate.js";
import Interview from "../models/Interview.js";
import { publishCandidateEvent } from "./candidate/eventService.js";
import { indexInterviewDocuments } from "./interview/knowledgeBaseService.js";
import { loadSpec, loadWorkflowSpec } from "../utils/specLoader.js";
import { runHiringWorkflow } from "../workflows/hiringWorkflow.js";

export async function startWorkflowForCandidate(candidateId, jobId) {
  const spec = loadWorkflowSpec();
  const workflow = await Workflow.create({
    candidate_id: candidateId,
    job_id: jobId,
    current_state: spec.workflow[0],
    status: "pending",
    execution_order: spec.workflow,
    node_states: spec.workflow.map((name) => ({ name, status: "pending", attempts: 0 }))
  });
  return runHiringWorkflow(workflow._id);
}

export async function manuallyStartWorkflow(payload) {
  return startWorkflowForCandidate(payload.candidate_id, payload.job_id);
}

export async function retryWorkflow(workflowId) {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    const error = new Error("Workflow not found");
    error.statusCode = 404;
    throw error;
  }
  const failedNode = workflow.node_states.find((node) => node.status === "failed");
  if (failedNode) {
    failedNode.status = "pending";
    failedNode.attempts = 0;
    failedNode.error = undefined;
    workflow.current_state = failedNode.name;
    workflow.status = "pending";
    await workflow.save();
  }
  return runHiringWorkflow(workflow._id);
}

export async function approveWorkflow(workflowId, approved, options = {}) {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    const error = new Error("Workflow not found");
    error.statusCode = 404;
    throw error;
  }
  workflow.approval_status = approved ? "approved" : "rejected";
  if (!approved) {
    workflow.status = "completed";
    await workflow.save();
    const candidate = await Candidate.findById(workflow.candidate_id);
    if (candidate) {
      candidate.status = "rejected";
      await candidate.save();
      await publishCandidateEvent({ candidateId: candidate._id, workflowId: workflow._id, event: "application_rejected" });
    }
    return workflow;
  }
  const interviewScheduledAt = new Date(options.interview_scheduled_at);
  if (Number.isNaN(interviewScheduledAt.getTime())) {
    const error = new Error("Valid interview time is required");
    error.statusCode = 400;
    throw error;
  }
  const interviewEndsAt = new Date(options.interview_ends_at);
  if (Number.isNaN(interviewEndsAt.getTime()) || interviewEndsAt.getTime() <= interviewScheduledAt.getTime()) {
    const error = new Error("Valid interview end time is required and must be after the start time");
    error.statusCode = 400;
    throw error;
  }
  workflow.interview_scheduled_at = interviewScheduledAt;
  workflow.interview_ends_at = interviewEndsAt;
  workflow.interview_difficulty = options.interview_difficulty || "standard";
  const uploadedDocuments = await indexInterviewDocuments({
    files: options.files || [],
    workflow,
    recruiterId: options.recruiter_id
  });
  const existingDocuments = workflow.context?.interviewDocuments || [];
  workflow.context = {
    ...workflow.context,
    interviewScheduledAt: interviewScheduledAt.toISOString(),
    interviewEndsAt: interviewEndsAt.toISOString(),
    interviewDifficulty: workflow.interview_difficulty,
    interviewTechnicalQuestionCount: options.interview_question_count ? Number(options.interview_question_count) : undefined,
    preferredLanguage: options.preferred_language || workflow.context?.preferredLanguage || "javascript",
    interviewDocuments: [...existingDocuments, ...uploadedDocuments]
  };
  const node = workflow.node_states.find((item) => item.name === "human_approval");
  if (node) node.status = "success";
  await workflow.save();
  const candidate = await Candidate.findById(workflow.candidate_id);
  if (candidate) await publishCandidateEvent({
    candidateId: candidate._id,
    workflowId: workflow._id,
    event: "application_approved",
    payload: {
      interview_scheduled_at: interviewScheduledAt.toISOString(),
      interview_ends_at: interviewEndsAt.toISOString()
    }
  });
  return runHiringWorkflow(workflow._id, { approved: true });
}

function verifyInterviewForDecision(interview) {
  const policy = loadSpec("interview/auto-evaluation-policy.json");
  const transcriptFound = interview.answers?.some((answer) => answer.clean_transcript || answer.manual_text);
  const codeFound = interview.answers?.some((answer) => answer.code);
  return {
    verified: Boolean(
      interview &&
      interview.status === "completed" &&
      typeof interview.overall_score === "number" &&
      interview.recommendation &&
      transcriptFound
    ),
    policy,
    checks: {
      overall_score: typeof interview?.overall_score === "number",
      recommendation: Boolean(interview?.recommendation),
      transcript: Boolean(transcriptFound),
      code_submission: Boolean(codeFound)
    }
  };
}

export async function recruiterReview(workflowId, decision, options = {}) {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    const error = new Error("Workflow not found");
    error.statusCode = 404;
    throw error;
  }
  const interview = await Interview.findOne({ workflow_id: workflow._id }).sort({ created_at: -1 });
  if (!interview) {
    const error = new Error("Interview result is required before recruiter review");
    error.statusCode = 400;
    throw error;
  }
  const verification = verifyInterviewForDecision(interview);
  if (!verification.verified) {
    const error = new Error("Interview result is not ready for recruiter review");
    error.statusCode = 400;
    error.details = verification.checks;
    throw error;
  }

  const candidate = await Candidate.findById(workflow.candidate_id);
  if (candidate) {
    candidate.status = decision === "reject" ? "rejected" : decision === "hold" ? "hold" : "hired";
    await candidate.save();
  }

  const recruiterNode = workflow.node_states.find((node) => node.name === "recruiter_review");
  if (recruiterNode) {
    recruiterNode.status = "success";
    recruiterNode.output = {
      decision,
      note: options.note || "",
      auto_verification: verification,
      reviewed_at: new Date()
    };
    recruiterNode.completed_at = new Date();
  }
  workflow.current_state = "final_email_agent";
  workflow.context = {
    ...workflow.context,
    recruiterReview: {
      decision,
      note: options.note || "",
      autoVerification: verification,
      reviewedAt: new Date().toISOString()
    }
  };
  workflow.status = "running";
  await workflow.save();
  return runHiringWorkflow(workflow._id, { approved: true, interviewCompleted: true, recruiterReviewed: true });
}

export async function getWorkflow(id) {
  const workflow = await Workflow.findById(id).populate("candidate_id job_id");
  if (!workflow) {
    const error = new Error("Workflow not found");
    error.statusCode = 404;
    throw error;
  }
  const logs = await WorkflowLog.find({ workflow_id: id }).sort({ created_at: 1 });
  const interview = await Interview.findOne({ workflow_id: workflow._id }).sort({ created_at: -1 });
  return { workflow: { ...workflow.toObject(), interview }, logs, node_state_spec: loadSpec("workflow/node-states.json") };
}

export async function listWorkflowSummaries() {
  const workflows = await Workflow.find().populate("candidate_id job_id").sort({ created_at: -1 });
  const spec = loadWorkflowSpec();
  const interviews = await Interview.find({ workflow_id: { $in: workflows.map((workflow) => workflow._id) } });
  const interviewByWorkflow = new Map(interviews.map((interview) => [interview.workflow_id.toString(), interview]));
  return {
    workflows: workflows.map((workflow) => ({
      ...workflow.toObject(),
      execution_order: spec.workflow,
      node_states: spec.workflow.map((name) => workflow.node_states.find((node) => node.name === name) || ({ name, status: "pending", attempts: 0 })),
      interview: interviewByWorkflow.get(workflow._id.toString()) || null
    })),
    node_state_spec: loadSpec("workflow/node-states.json")
  };
}

export async function deleteWorkflow(workflowId) {
  if (!mongoose.isValidObjectId(workflowId)) {
    const error = new Error("Invalid workflow id");
    error.statusCode = 400;
    throw error;
  }
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    const error = new Error("Workflow not found");
    error.statusCode = 404;
    throw error;
  }
  await WorkflowLog.deleteMany({ workflow_id: workflowId });
  await Workflow.deleteOne({ _id: workflowId });
  return { deleted: true, workflow_id: workflowId };
}

export async function clearWorkflows() {
  const workflows = await Workflow.find().select("_id");
  const workflowIds = workflows.map((workflow) => workflow._id);
  await WorkflowLog.deleteMany({ workflow_id: { $in: workflowIds } });
  const result = await Workflow.deleteMany({ _id: { $in: workflowIds } });
  return { deleted: result.deletedCount || 0 };
}
