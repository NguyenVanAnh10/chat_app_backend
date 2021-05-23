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
const CHAT_ROOM = "CHAT_ROOM";

const chat = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // SIGNALING
    socket.on("join_all_room", async ({ userId }) => {
      socket.join(userId);
      try {
        const roomsIncludeUser = await findAllRoomsIncludeUser(userId);
        roomsIncludeUser.map((r) => socket.join(r._id.toString()));
      } catch (error) {
        socket.emit("error", { error });
      }
    });
    socket.on("create_room_chat_one_to_one", async ({ fromUser, toUser }) => {
      try {
        const room = await findRoomWithUserIds([fromUser, toUser]);
        let roomId = room[0]?._id.toString();
        if (!room.length) {
          const chatRoom = await createRoom({
            createrId: ObjectId(fromUser),
            createAt: Date.now(),
            userIds: [ObjectId(fromUser), ObjectId(toUser)],
          });
          await updateUser(
            { _id: ObjectId(fromUser) },
            { $push: { chatroomIds: chatRoom._id } }
          );
          await updateUser(
            { _id: ObjectId(toUser) },
            { $push: { chatroomIds: chatRoom._id } }
          );
          roomId = chatRoom._id.toString();
        }
        socket.in(toUser).socketsJoin(roomId);
        socket.join(roomId);
        socket.emit("create_room_chat_one_to_one_success", { roomId });
      } catch (e) {
        socket.emit("error", { error: { e } });
      }
    });

    // MESSAGING
    // socket.on("send_message", async ({ roomId, message }) => {
    //   try {
    //     const msg = await createMessage({
    //       sender: message.sender,
    //       content: message.content,
    //       createAt: Date.now(),
    //     });
    //     await updateRoom(
    //       { _id: roomId },
    //       { $push: { messageIds: msg._id.toString() } }
    //     );
    //     socket.to(roomId).emit("receive_message", { roomId });
    //     socket.emit("send_message_success", {
    //       roomId,
    //       messageId: msg._id.toString(),
    //     });
    //   } catch (e) {
    //     socket.emit("error", { error: { e } });
    //   }
    // });

    socket.on("callUser", ({ userToCall, signal, from, name }) => {
      io.to(CHAT_ROOM).emit("callUser", {
        signal,
        from,
        name,
      });
    });

    socket.on("answerCall", ({ to, signal }) => {
      io.to(CHAT_ROOM).emit("callAccepted", signal);
    });

    socket.on("disconnect", () => {
      socket.broadcast.emit("callended");
    });
  });
  return io;
};
export default chat;
