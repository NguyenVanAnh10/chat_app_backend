import { getUsers as getUsersModel } from "../models/user.js";

export const getUsers = async (req, res) => {
  const { keyword } = req.query;
  try {
    const users = await getUsersModel(keyword);
    res.json(users);
  } catch (error) {
    res.json({ error });
  }
};
