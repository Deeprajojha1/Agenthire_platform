import * as portalService from "../../services/candidate/portalService.js";
import { jsonResponse } from "../../utils/response.js";

export async function dashboard(req, res) {
  jsonResponse(res, await portalService.dashboard(req.user, req.query.search));
}

export async function jobs(req, res) {
  jsonResponse(res, await portalService.jobs(req.user, req.query.search));
}

export async function applicationDetails(req, res) {
  jsonResponse(res, await portalService.applicationDetails(req.user, req.params.id));
}

export async function listNotifications(req, res) {
  jsonResponse(res, await portalService.listNotifications(req.user));
}

export async function markNotificationRead(req, res) {
  jsonResponse(res, await portalService.markNotificationRead(req.user, req.params.id));
}

export async function markAllNotificationsRead(req, res) {
  jsonResponse(res, await portalService.markAllNotificationsRead(req.user));
}
