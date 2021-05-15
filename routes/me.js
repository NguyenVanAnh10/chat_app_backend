import { Router } from "express";

import { getMe } from "../controllers/me.js";

const router = Router();

router.get("/", getMe);

export default router;
