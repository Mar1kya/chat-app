import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], 
  },
});

const userSocketMap = new Map();

export function getReceiverSocketIds(userId) {
  return [...(userSocketMap.get(String(userId)) ?? [])];
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
    userSocketMap.get(userId).add(socket.id);
  }

  io.emit("getOnlineUsers", [...userSocketMap.keys()]);

  socket.on("disconnect", () => {
    if (!userId) return;

    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socket.id); 
      if (sockets.size === 0) userSocketMap.delete(userId);
    }

    io.emit("getOnlineUsers", [...userSocketMap.keys()]);
  });
});

export { io, app, server };