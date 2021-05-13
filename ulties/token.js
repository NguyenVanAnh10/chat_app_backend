import jwt from "jsonwebtoken";

import configs from "../configs/index.js";

export const generateToken = (data) => {
  return jwt.sign(data, configs.SECRET_KEY);
};

export const decodeToken = (token, expiredTime = 2 * 60 * 60) => {
  const decodeToken = jwt.verify(token, configs.SECRET_KEY);

  if (decodeToken.iat > Date.now() + expiredTime) {
    return {
      expired: true,
    };
  }
  return decodeToken;
};
