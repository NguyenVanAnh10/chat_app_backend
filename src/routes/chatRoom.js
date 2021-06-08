import { Router } from "express";

import { getChatRooms, getChatRoom, postChatRoom } from "controllers/chatRoom";

const router = Router({ mergeParams: true });

router.route("/").get(getChatRooms);
router.route("/:roomId").get(getChatRoom);
router.post("/", postChatRoom);

export default router;
