import { Router } from "express";

import { postRegister, postSetPasswordRegister } from "controllers/register";

const router = Router();

router.post("/", postRegister);
router.post("/set_password", postSetPasswordRegister);

export default router;
