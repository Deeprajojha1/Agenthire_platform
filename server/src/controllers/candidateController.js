import * as candidateService from "../services/candidateService.js";
import { jsonResponse } from "../utils/response.js";

export async function uploadCandidate(req, res) {
  jsonResponse(res, await candidateService.uploadCandidate(req.body, req.file, req.user), 201);
}

export async function checkApplication(req, res) {
  jsonResponse(res, await candidateService.checkApplication(req.body));
}

export async function listCandidates(req, res) {
  jsonResponse(res, await candidateService.listCandidates());
}

export async function getCandidate(req, res) {
  jsonResponse(res, await candidateService.getCandidate(req.params.id));
}

export async function updateCandidate(req, res) {
  jsonResponse(res, await candidateService.updateCandidate(req.params.id, req.body));
}
