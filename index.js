import cors from "cors";
import express from "express";
import http from "http";
import bodyParser from "body-parser";

import users from "./routes/users.js";
import login from "./routes/login.js";
import register from "./routes/register.js";
import chatSocket from "./sockets/chat.js";
import db from "./models/index.js";

const PORT = process.env.PORT || 5000;
const app = express();
const httpServer = http.createServer(app);

app.use(cors());
chatSocket(httpServer);
app.use(bodyParser.json());

app.use("/users", users);
app.use("/login", login);
app.use("/register", register);

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.");
  console.log("Closing http server.");
  httpServer.close(async () => {
    console.log("Http server closed.");
    await db.close();
    process.exit(0);
  });
});

httpServer.listen(PORT, () => console.log(`Server is running on ${PORT}`));
