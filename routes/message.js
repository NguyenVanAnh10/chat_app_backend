import { Router } from "express";

import { getMessages } from "../controllers/message.js";

const router = Router();

router.use("/", getMessages);

export default router;
