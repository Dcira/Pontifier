import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.utils.js";
import { selectUserById } from "../queries/auth.queries.js";
import { selectCollegeIdsForTeamMember } from "../queries/delegates.queries.js";

let ioInstance = null;

export function getIo() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
}

export function initSocket(httpServer) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  ioInstance = new Server(httpServer, {
    cors: {
      origin: frontendUrl,
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || typeof token !== "string") {
        return next(new Error("Unauthorized"));
      }
      const decoded = verifyAccessToken(token);
      const user = await selectUserById(decoded.sub);
      if (!user || !user.is_active) {
        return next(new Error("Unauthorized"));
      }
      socket.user = {
        id: user.id,
        role: user.role,
        college_id: user.college_id,
      };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", async (socket) => {
    const { role, college_id: collegeId, id } = socket.user;
    if (role === "admin") {
      socket.join("admin_room");
    } else if (role === "college_manager" && collegeId) {
      socket.join(`college_${collegeId}`);
    } else if (role === "team_member") {
      socket.join(`member_${id}`);
      try {
        const collegeIds = await selectCollegeIdsForTeamMember(id);
        for (const cid of collegeIds) {
          socket.join(`college_${cid}`);
        }
      } catch {
        /* ignore */
      }
    }
  });

  return ioInstance;
}
