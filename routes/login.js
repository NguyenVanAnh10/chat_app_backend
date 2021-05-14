import { Router } from "express";

import { postLogin } from "../controllers/login.js";

const router = Router();

router.post("/", postLogin);

export default router;
