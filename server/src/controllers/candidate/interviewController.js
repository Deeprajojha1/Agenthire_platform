import * as interviewService from "../../services/interview/interviewService.js";
import { jsonResponse } from "../../utils/response.js";

export async function startInterview(req, res) {
  jsonResponse(res, await interviewService.startInterview(req.user, req.params.applicationId, req.body), 201);
}

export async function getInterview(req, res) {
  jsonResponse(res, await interviewService.getInterview(req.user, req.params.interviewId));
}

export async function questionAudio(req, res) {
  jsonResponse(res, await interviewService.questionAudio(req.user, req.params.interviewId, req.params.questionId));
}

export async function submitAnswer(req, res) {
  jsonResponse(res, await interviewService.submitAnswer(req.user, req.params.interviewId, req.body, req.file));
}

export async function completeInterview(req, res) {
  jsonResponse(res, await interviewService.completeInterview(req.user, req.params.interviewId));
}
