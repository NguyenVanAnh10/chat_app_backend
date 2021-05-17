import { Router } from "express";

import authorizeMiddleware from "../middlewares/authorize.js";
import users from "../routes/users.js";
import login from "../routes/login.js";
import logout from "../routes/logout.js";
import register from "../routes/register.js";
import me from "../routes/me.js";
import message from "../routes/message.js";
import chatRoom from '../routes/chatRoom.js';

const router = Router();

router.use("/users", authorizeMiddleware, users);
router.use("/messages", authorizeMiddleware, message);
router.use("/chat_rooms", authorizeMiddleware, chatRoom);
router.use("/login", login);
router.use("/logout", logout);
router.use("/me", me);
router.use("/register", register);

export default router;
