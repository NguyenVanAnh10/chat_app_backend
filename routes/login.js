import { Router } from "express";

import { findUser } from "../models/user.js";

const router = Router();

router.post("/", async (req, res) => {
  const { user, password } = req.body;
  try {
    const account = await findUser({ userName: user, password });
    return res.json(account);
  } catch (error) {
    res.json(error);
  }
});

export default router;
