import { Router } from "express";

import { postRegister, getRegister } from "../controllers/register.js";

const router = Router();

router.post("/", postRegister);

router.get("/", getRegister);

export default router;
