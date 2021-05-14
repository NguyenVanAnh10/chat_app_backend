import { generateToken, decodeToken } from "../ulties/token.js";
import { sendTokenConfirmationEmail } from "../ulties/email.js";
import { createUser, findUser, updateUser } from "../models/user.js";
import configs from "../configs/index.js";
import {
  generateCryptPassword,
  compareCryptPassword,
} from "../ulties/index.js";

export const postRegister = async (req, res) => {
  const { userName, password: plainTextPassword, email } = req.body;
  const registerToken = generateToken({ userName, email });

  try {
    const cryptPassword = await generateCryptPassword(plainTextPassword);
    const createdUser = await createUser({
      userName,
      password: cryptPassword,
      email,
      registerToken,
    });
    sendTokenConfirmationEmail(email, registerToken);
    res.json(createdUser);
  } catch (e) {
    res.status(400).json(e);
  }
};

export const getRegister = async (req, res) => {
  const { token } = req.query;
  const { userName, email } = decodeToken(token);
  try {
    const user = await updateUser({ userName, email });
    res.json({});
  } catch (e) {
    res
      .status(400)
      .json({ error: { message: "Something went wrong", error: e } });
  }
};
