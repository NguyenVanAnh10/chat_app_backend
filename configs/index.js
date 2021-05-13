import dotenv from "dotenv";
dotenv.config();

export default {
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  SECRET_KEY: process.env.SECRET_KEY,
};
