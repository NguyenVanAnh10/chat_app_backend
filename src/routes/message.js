import { Router } from "express";

import {
  getMessages,
  postMessage,
  getMessage,
  postUserHasSeenMessages,
} from "../controllers/message.js";

const router = Router();

router.get("/", getMessages);
router.route("/:messageId").get(getMessage);
router.post("/", postMessage);
router.post("/seen", postUserHasSeenMessages);

export default router;
