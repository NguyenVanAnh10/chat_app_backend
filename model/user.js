import client from "./index.js";
import configs from "../configs/index.js";

export const getUsers = async () => {
  try {
    const db = await client.db(configs.DB_NAME);
    const users = await db.collection("users").find();
    return users.toArray();
  } catch (e) {
    console.error(e);
  }
};

export const findUser = async ({ userName, password }) => {
  try {
    const db = await client.db(configs.DB_NAME);
    const user = await db.collection("users").findOne({ userName, password });
    return user;
  } catch (e) {
    console.error(e);
  }
};
