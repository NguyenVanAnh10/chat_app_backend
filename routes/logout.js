import { Router } from "express";

import { postLogout } from "../controllers/logout.js";

const router = Router();

router.post("/", postLogout);

export default router;
