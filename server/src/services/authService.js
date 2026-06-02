import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function signup(payload) {
  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }
  const password = await bcrypt.hash(payload.password, 12);
  const user = await User.create({ ...payload, password, role: "recruiter" });
  return { token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}

export async function login(payload) {
  const user = await User.findOne({ email: payload.email });
  if (!user || !(await bcrypt.compare(payload.password, user.password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }
  return { token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}
