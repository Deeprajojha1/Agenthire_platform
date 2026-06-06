import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import Candidate from "./models/Candidate.js";
import User from "./models/User.js";
import { setCandidateSocketServer } from "./services/candidate/eventService.js";

function parseToken(socket) {
  const authToken = socket.handshake.auth?.token;
  const header = socket.handshake.headers?.authorization || "";
  return authToken || (header.startsWith("Bearer ") ? header.slice(7) : null);
}

export function attachSocketServer(server) {
  const io = new Server(server, {
    cors: {
      credentials: true,
      origin: [...env.CLIENT_ORIGINS, "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = parseToken(socket);
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(payload.sub).select("-password");
      if (!user) return next(new Error("Invalid session"));
      socket.user = user;
      return next();
    } catch {
      return next(new Error("Invalid session"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("application:subscribe", async (applicationId, callback) => {
      const user = socket.user;
      const candidate = await Candidate.findById(applicationId).select("email");
      const allowed = candidate && (["recruiter", "admin"].includes(user.role) || candidate.email === user.email);
      if (!allowed) {
        callback?.({ ok: false, error: "Application access denied" });
        return;
      }
      socket.join(`application:${applicationId}`);
      callback?.({ ok: true });
    });
  });

  setCandidateSocketServer(io);
  return io;
}
