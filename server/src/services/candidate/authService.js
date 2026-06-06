import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import Candidate from "../../models/Candidate.js";
import User from "../../models/User.js";

function profile(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, candidateProfile: user.candidateProfile };
}

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, { expiresIn: "7d" });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function candidateClaimFilter(user) {
  return {
    candidate_user_id: null,
    email: user.email
  };
}

export async function signup(payload) {
  const email = normalizeEmail(payload.email);
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const password = await bcrypt.hash(payload.password, 12);
  const user = await User.create({ name: payload.name.trim(), email, password, role: "candidate" });
  await Candidate.updateMany(candidateClaimFilter(user), { candidate_user_id: user._id });
  return { token: signToken(user), user: profile(user) };
}

export async function login(payload) {
  const email = normalizeEmail(payload.email);
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Invalid candidate email or password");
    error.statusCode = 401;
    throw error;
  }
  if (user.role !== "candidate") {
    const error = new Error(`This email is registered as ${user.role}. Use a candidate account to log in here.`);
    error.statusCode = 403;
    throw error;
  }
  if (!(await bcrypt.compare(payload.password, user.password))) {
    const error = new Error("Incorrect password for this candidate account.");
    error.statusCode = 401;
    throw error;
  }
  await Candidate.updateMany(candidateClaimFilter(user), { candidate_user_id: user._id });
  return { token: signToken(user), user: profile(user) };
}
