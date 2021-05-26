import { Server } from "socket.io";
import mongoose from "mongoose";

import { createMessage } from "../models/message.js";
import {
  createRoom,
  findRoomWithUserIds,
  updateRoom,
  findAllRoomsIncludeUser,
} from "../models/chat_room.js";
import { updateUser } from "../models/user.js";

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

    socket.on("call_to", ({ receiverId, signal, callerId, roomId }) => {
      socket.to(roomId).emit("a_call_from", {
        roomId,
        signal,
        receiverId,
        callerId,
      });
    });

    socket.on("answer_call", ({ signal, roomId }) => {
      socket.to(roomId).emit("call_accepted", { signal });
    });

    socket.on("disconnect", () => {
      socket.broadcast.emit("callended");
    });
  });
  return io;
};
export default chat;
