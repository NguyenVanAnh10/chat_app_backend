import { Router } from "express";

import { getMe } from "controllers/me";

const router = Router();

router.get("/", getMe);

export default router;
