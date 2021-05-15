import { findUser } from "../models/user.js";
import { ExceptionError } from "../ulties/index.js";
import { decodeToken } from "../ulties/token.js";

export const getMe = async (req, res) => {
  const { token_user } = req.cookies;
  try {
    if (!token_user) {
      throw new ExceptionError({ name: "TokenError", msg: "Invalid token" });
    }
    const { userId } = await decodeToken(token_user);
    const user = (await findUser({ _id: userId })).toObject();
    delete user.password;
    res.json(user);
  } catch (error) {
    res.status(401).json({ error });
  }
};
