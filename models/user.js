import mongoose from "mongoose";

import configs from "../configs/index.js";

const userSchema = new mongoose.Schema({
  userName: String,
  password: String,
  email: String,
  registerToken: String,
  isVerified: { type: Boolean, default: false },
});

const UserModel = mongoose.model("User", userSchema);

export const getUsers = async () => {
  const users = await UserModel.find();
  return users.map((u) => u.toObject());
};

export const findUser = async (userData) => {
  const user = await UserModel.findOne(userData);
  return user;
};

export const createUser = async (userData) => {
  const user = await UserModel.create(userData);
  return user;
};

export const updateUser = async (queryUser, userData) => {
  const user = await UserModel.updateOne(queryUser, userData);
  return user;
};
