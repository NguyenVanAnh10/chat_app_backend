import { Router } from "express";

import { getChatRooms, getChatRoom } from "../controllers/chatRoom.js";

const router = Router({ mergeParams: true });

router.route("/").get(getChatRooms);
router.route("/:roomId").get(getChatRoom);

export default router;
