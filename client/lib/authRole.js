const authRoleKey = "agenthire_auth_role";
const validRoles = new Set(["recruiter", "candidate"]);

export function getAuthRoleFallback(defaultRole = "recruiter") {
  if (typeof window === "undefined") return defaultRole;
  try {
    const role = window.sessionStorage.getItem(authRoleKey);
    return validRoles.has(role) ? role : defaultRole;
  } catch {
    return defaultRole;
  }
}

export function rememberAuthRole(role) {
  if (typeof window === "undefined" || !validRoles.has(role)) return;
  try {
    window.sessionStorage.setItem(authRoleKey, role);
  } catch {
    // Storage can be disabled by browser settings; the form still works with local state.
  }
}
