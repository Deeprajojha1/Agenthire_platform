import mongoose from "mongoose";
import Workflow from "../models/Workflow.js";
import WorkflowLog from "../models/WorkflowLog.js";
import Candidate from "../models/Candidate.js";
import { publishCandidateEvent } from "./candidate/eventService.js";
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

export async function approveWorkflow(workflowId, approved) {
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
  const node = workflow.node_states.find((item) => item.name === "human_approval");
  if (node) node.status = "success";
  await workflow.save();
  const candidate = await Candidate.findById(workflow.candidate_id);
  if (candidate) await publishCandidateEvent({ candidateId: candidate._id, workflowId: workflow._id, event: "application_approved" });
  return runHiringWorkflow(workflow._id, { approved: true });
}

export async function getWorkflow(id) {
  const workflow = await Workflow.findById(id).populate("candidate_id job_id");
  if (!workflow) {
    const error = new Error("Workflow not found");
    error.statusCode = 404;
    throw error;
  }
  const logs = await WorkflowLog.find({ workflow_id: id }).sort({ created_at: 1 });
  return { workflow, logs, node_state_spec: loadSpec("workflow/node-states.json") };
}

export async function listWorkflowSummaries() {
  const workflows = await Workflow.find().populate("candidate_id job_id").sort({ created_at: -1 });
  return { workflows, node_state_spec: loadSpec("workflow/node-states.json") };
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
