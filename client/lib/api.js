const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agenthire_token");
}

export function setToken(token) {
  localStorage.setItem("agenthire_token", token);
  document.cookie = `agenthire_token=${token}; path=/; max-age=604800`;
}

export function clearToken() {
  localStorage.removeItem("agenthire_token");
  document.cookie = "agenthire_token=; path=/; max-age=0";
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || "Request failed");
  }
  return json.data;
}
