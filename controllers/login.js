import { findUser } from "../models/user.js";
import { compareCryptPassword, ExceptionError } from "../ulties/index.js";
import { decodeToken, generateToken } from "../ulties/token.js";

export const postLogin = async (req, res) => {
  const { token } = req.body;
  switch (!!token) {
    case true:
      try {
        const { userName, email } = await decodeToken(token);
        const account = await findUser({ userName, email });
        if (!account.registerToken) {
          throw new ExceptionError({
            name: "TokenError",
            msg: "Token is expired",
          });
        }
        res.json({});
      } catch (error) {
        res.status(400).json({ error });
      }
      break;
    default:
      const { userName, password } = req.body;
      try {
        const account = await findUser({ userName });
        if (!account) {
          throw new ExceptionError({
            name: "AccountError",
            msg: "User doesn't exist",
          });
        }
        const checkPassword = await compareCryptPassword(
          password,
          account.password
        );
        if (!checkPassword) {
          throw new ExceptionError({
            name: "AccountError",
            msg: "Password is wrong",
          });
        }
        const token_user = generateToken({
          userId: account._id.toString(),
        });
        res.cookie("token_user", token_user);
        res.json(account);
      } catch (error) {
        res.status(401).json({ error });
      }
      break;
  }
};


