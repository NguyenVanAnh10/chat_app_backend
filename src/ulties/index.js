import bcrypt from 'bcrypt';

import configs from 'configs';

export function ExceptionError({ name, msg }) {
  this.message = msg;
  this.name = name;
}

export const generateCryptPassword = async plainTextPassword => {
  const salt = await bcrypt.genSalt(Number(configs.SALT_ROUNDS) || 10);
  return bcrypt.hash(plainTextPassword, salt);
};

export const compareCryptPassword = (plainTextPassword,
  hash) => bcrypt.compare(plainTextPassword, hash);
