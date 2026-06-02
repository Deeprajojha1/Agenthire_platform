import * as authService from "../services/authService.js";
import { jsonResponse } from "../utils/response.js";

export async function signup(req, res) {
  jsonResponse(res, await authService.signup(req.body), 201);
}

export async function login(req, res) {
  jsonResponse(res, await authService.login(req.body));
}

export async function me(req, res) {
  jsonResponse(res, { user: req.user });
}
