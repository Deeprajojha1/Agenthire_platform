import * as workflowService from "../services/workflowService.js";
import { jsonResponse } from "../utils/response.js";

export async function startWorkflow(req, res) {
  jsonResponse(res, await workflowService.manuallyStartWorkflow(req.body), 201);
}

export async function retryWorkflow(req, res) {
  jsonResponse(res, await workflowService.retryWorkflow(req.body.workflow_id));
}

export async function approveWorkflow(req, res) {
  jsonResponse(res, await workflowService.approveWorkflow(req.body.workflow_id, req.body.approved));
}

export async function getWorkflow(req, res) {
  jsonResponse(res, await workflowService.getWorkflow(req.params.id));
}

export async function listWorkflows(req, res) {
  jsonResponse(res, await workflowService.listWorkflowSummaries());
}
