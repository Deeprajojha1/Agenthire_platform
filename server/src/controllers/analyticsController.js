import { getAnalytics } from "../analytics/analyticsService.js";
import { jsonResponse } from "../utils/response.js";

export async function analytics(req, res) {
  jsonResponse(res, await getAnalytics());
}
