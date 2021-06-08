import { Server } from "socket.io";
import mongoose from "mongoose";

import { createMessage } from "models/message";
import {
  createRoom,
  findRoomWithUserIds,
  updateRoom,
  findAllRoomsIncludeUser,
} from "models/chat_room";
import { updateUser } from "models/user";

const ObjectId = mongoose.Types.ObjectId;

const chat = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_all_room", async ({ userId }) => {
      socket.join(userId);
      try {
        const roomsIncludeUser = await findAllRoomsIncludeUser(userId);
        roomsIncludeUser.map((r) => socket.join(r._id.toString()));
      } catch (error) {
        socket.emit("error", { error });
      }
    });

    socket.on("call_to", ({ signal, id, roomId }) => {
      io.to(roomId).emit("a_call_from", {
        roomId,
        signal,
        id,
      });
    });

    socket.on("answer_call", ({ signal, roomId }) => {
      socket.to(roomId).emit("call_accepted", { signal });
    });
    socket.on("decline_incoming_call", ({ callerId, roomId }) => {
      io.to(roomId).emit("decline_incoming_call", { callerId, roomId });
    });
    socket.on("callended", ({ userId, roomId }) => {
      io.to(roomId).emit("callended", { userId });
    });
    socket.on("disconnect", () => {
      socket.emit("disconnect_socket");
    });
  });
  return io;
};
export default chat;
