import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, error: { message: "Invalid session" } });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: { message: "Invalid session" } });
  }
}

export function requireRecruiter(req, res, next) {
  if (!["recruiter", "admin"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, error: { message: "Recruiter access required" } });
  }
  return next();
}
