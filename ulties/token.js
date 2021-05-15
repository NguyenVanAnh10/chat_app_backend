import jwt from "jsonwebtoken";

import configs from "../configs/index.js";
import { ExceptionError } from "./index.js";

export const generateToken = (data) => {
  return jwt.sign(data, configs.SECRET_KEY);
};

export const decodeToken = (token, expiredTime = 2 * 60 * 60) => {
  const decodeResult = jwt.verify(
    token,
    configs.SECRET_KEY,
    (error, decoded) => {
      if (error || decoded.iat > Date.now() + expiredTime) {
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
