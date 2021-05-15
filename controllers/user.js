import { getUsers as getUsersModel } from "../models/user.js";

export const getUsers = async (req, res) => {
  try {
    const users = await getUsersModel();
    res.json(users);
  } catch (error) {
    res.json({ error });
  }
};
