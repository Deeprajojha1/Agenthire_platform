import { jsonError } from "../utils/response.js";

export function notFound(req, res) {
  return jsonError(res, "Route not found", 404);
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  if (status === 500) {
    console.error(JSON.stringify({ message: err.message, stack: err.stack, timestamp: new Date().toISOString() }));
  }
  return jsonError(res, message, status);
}
