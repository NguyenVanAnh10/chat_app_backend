import { findUser } from "models/user";
import { ExceptionError } from "ulties";
import { decodeToken } from "ulties/token";

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
