import { getUsers as getUsersModel, getUserId } from "../models/user.js";

export const getUsers = async (req, res) => {
  const { keyword } = req.query;
  try {
    const users = await getUsersModel(keyword);
    res.json(users);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const getUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await getUserId(userId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error });
  }
};
