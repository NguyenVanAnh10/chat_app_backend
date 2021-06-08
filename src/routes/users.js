import { Router } from "express";

import { getUsers, getUser } from "controllers/user";

const router = Router();

router.get("/", getUsers);
router.route("/:userId").get(getUser);

export default router;
