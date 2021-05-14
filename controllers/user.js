import { getUsers as getUsersModel } from "../models/user.js";

export const getUsers = async (req, res) => {
  const users = await getUsersModel();
  res.json(users);
};
