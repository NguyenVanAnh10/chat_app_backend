import jwt from "jsonwebtoken";

import configs from "../configs/index.js";
import { ExceptionError } from "./index.js";

export const generateToken = (data) => {
  return jwt.sign(data, configs.SECRET_KEY, { expiresIn: 10 * 60 * 60 });
};

export const decodeToken = (token, expiredTime = 10 * 60 * 60) => {
  const decodeResult = jwt.verify(
    token,
    configs.SECRET_KEY,
    (error, decoded) => {
      if (error) {
        throw new ExceptionError({
          name: "TokenError",
          msg: "Invalid token or expired",
        });
      }
      return decoded;
    }
  );

  return decodeResult;
};
