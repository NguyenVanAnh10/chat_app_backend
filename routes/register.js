import { Router } from "express";

import {
  postRegister,
  postSetPasswordRegister,
} from "../controllers/register.js";

const router = Router();

router.post("/", postRegister);
router.post("/set_password", postSetPasswordRegister);

export default router;
