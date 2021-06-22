import jwt from 'jsonwebtoken';

import configs from 'configs';
import { ExceptionError } from './index';

export const generateToken = data => jwt.sign(data, configs.SECRET_KEY, {
  expiresIn: 10 * 60 * 60,
});

export const decodeToken = token => {
  const decodeResult = jwt.verify(
    token,
    configs.SECRET_KEY,
    (error, decoded) => {
      if (error) {
        console.error(error);
        throw new ExceptionError({ name: error.name, message: error.message });
      }
      return decoded;
    },
  );

  return decodeResult;
};
