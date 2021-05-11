import { Server } from "socket.io";

const CHAT_ROOM = "CHAT_ROOM";

const chat = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.join(CHAT_ROOM);
    // socket.emit("me", socket.id);
    socket.on("disconnect", () => {
      socket.broadcast.emit("callended");
    });
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
    socket.on("message", ({ message }) => {
      socket.broadcast.emit("message", { message });
    });
  });
};
export default chat;
