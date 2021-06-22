import bcrypt from 'bcrypt';

import configs from 'configs';

export function ExceptionError({ name, message }) {
  this.message = message;
  this.name = name;
}

export const generateCryptPassword = async plainTextPassword => {
  const salt = await bcrypt.genSalt(Number(configs.SALT_ROUNDS) || 10);
  return bcrypt.hash(plainTextPassword, salt);
};

export const compareCryptPassword = (plainTextPassword,
  hash) => bcrypt.compare(plainTextPassword, hash);
