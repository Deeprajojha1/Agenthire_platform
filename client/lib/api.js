export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || BACKEND_URL;

function getCookieToken() {
  if (typeof document === "undefined") return null;
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("agenthire_token="))
    ?.split("=")[1] || null;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agenthire_token") || getCookieToken();
}

export function setToken(token) {
  localStorage.setItem("agenthire_token", token);
  document.cookie = `agenthire_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function clearToken() {
  localStorage.removeItem("agenthire_token");
  document.cookie = "agenthire_token=; path=/; max-age=0";
}

function isSessionError(response, message) {
  const normalized = String(message || "").toLowerCase();
  return (
    response.status === 401 &&
    (normalized.includes("invalid session") ||
      normalized.includes("authentication required") ||
      normalized.includes("session expired"))
  );
}

function notifySessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("agenthire:session-expired"));
}

function errorMessage(error, fallback = "Request failed. Please try again.") {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  if (error?.type === "error") return "Network request failed. Please check that the server is running.";
  return fallback;
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw new Error(errorMessage(error, "Network request failed. Please check that the server is running."));
  }
  const json = await response.json().catch(() => ({ success: false, error: { message: "Request failed" } }));
  if (!response.ok || !json.success) {
    const message = errorMessage(json.error?.message || json.error, "Request failed");
    if (isSessionError(response, message)) {
      clearToken();
      notifySessionExpired();
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error(message);
  }
  return json.data;
}
