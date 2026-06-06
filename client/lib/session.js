import { API_URL, clearToken, getToken } from "./api.js";

async function rawSessionRequest(path, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const json = await response.json().catch(() => null);
  return { response, json };
}

export async function resolveSession() {
  const token = getToken();
  if (!token) return null;

  try {
    const candidate = await rawSessionRequest("/candidate/auth/me", token);
    if (candidate.response.ok && candidate.json?.success) {
      return { role: "candidate", user: candidate.json.data.user, redirectTo: "/candidate/dashboard" };
    }

    const recruiter = await rawSessionRequest("/auth/me", token);
    if (recruiter.response.ok && recruiter.json?.success) {
      return { role: recruiter.json.data.user?.role || "recruiter", user: recruiter.json.data.user, redirectTo: "/dashboard" };
    }

    if (candidate.response.status === 401 || recruiter.response.status === 401) {
      clearToken();
    }
  } catch {
    return null;
  }

  return null;
}
