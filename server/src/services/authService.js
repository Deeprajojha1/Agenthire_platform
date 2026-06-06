import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, { expiresIn: "7d" });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
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
  return { token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}

export async function login(payload) {
  const user = await User.findOne({ email: normalizeEmail(payload.email) });
  if (!user || !["recruiter", "admin"].includes(user.role) || !(await bcrypt.compare(payload.password, user.password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }
  return { token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}
