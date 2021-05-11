import { Router } from "express";

import { getUsers } from "../model/user.js";

const router = Router();

router.get("/", async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

export default router;
