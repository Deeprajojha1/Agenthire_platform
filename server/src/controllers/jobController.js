import * as jobService from "../services/jobService.js";
import { jsonResponse } from "../utils/response.js";

export async function createJob(req, res) {
  jsonResponse(res, await jobService.createJob(req.body, req.user), 201);
}

export async function listJobs(req, res) {
  jsonResponse(res, await jobService.listJobs());
}

export async function getJob(req, res) {
  jsonResponse(res, await jobService.getJob(req.params.id));
}

export async function updateJob(req, res) {
  jsonResponse(res, await jobService.updateJob(req.params.id, req.body));
}
