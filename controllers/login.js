import { findUser } from "../models/user.js";
import { compareCryptPassword } from "../ulties/index.js";

export const postLogin = async (req, res) => {
  const { user, password } = req.body;
  try {
    const account = await findUser({ userName: user });
    if (!account) {
      res.status(401).json({ error: { message: "User doesn't exist" } });
    }
    const checkPassword = await compareCryptPassword(
      password,
      account.password
    );
    if (!checkPassword) {
      return res
        .status(401)
        .json({ error: { message: "Password is wrong, please try again" } });
    }

    return res.json(account);
  } catch (error) {
    res.status(400).json(error);
  }
};
