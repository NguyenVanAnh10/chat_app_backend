const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Server is running, ");
});

io.on("connection", (socket) => {
  socket.emit("me", socket.id);
  socket.on("disconnect", () => {
    socket.broadcast.emit("callended");
  });
  socket.on("callUser", ({ userToCall, signal, from, name }) => {
    io.to(userToCall).emit("callUser", {
      signal,
      from,
      name,
    });
  });

  socket.on("answerCall", ({ to, signal }) => {
    io.to(to).emit("callAccepted", signal);
  });
  socket.on("message", ({ message }) => {
    socket.broadcast.emit("message", { message });
  });
});

server.listen(PORT, () => console.log(`Server is running on ${PORT}`));
