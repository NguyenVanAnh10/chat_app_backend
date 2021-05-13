import { Router } from "express";

import { generateToken, decodeToken } from "../ulties/token.js";
import { sendTokenConfirmationEmail } from "../ulties/email.js";
import { createUser, findUser, updateUser } from "../models/user.js";
import { json } from "body-parser";

const router = Router();

router.post("/", async (req, res) => {
  const { userName, password, email } = req.body;
  const registerToken = generateToken(req.body);
  try {
    const createdUser = await createUser({
      userName,
      password,
      email,
      registerToken,
    });
    sendTokenConfirmationEmail(email, registerToken);
    res.json(createdUser);
  } catch (e) {
    res.status(400).json(e);
  }
});

router.get("/", async (req, res) => {
  const { token } = req.query;
  const { userName, password, email } = decodeToken(token);
  try {
    const user = await updateUser({ userName, password, email });
    res.json(user);
  } catch (e) {
    res
      .status(400)
      .json({ error: { message: "Something went wrong", error: e } });
  }
});

export default router;
