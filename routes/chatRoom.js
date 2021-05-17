import { Router } from "express";

import { getChatRooms } from "../controllers/chatRoom.js";

const router = Router();

router.use("/", getChatRooms);

export default router;
