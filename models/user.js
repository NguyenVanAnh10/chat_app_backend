import mongoose from "mongoose";

import configs from "../configs/index.js";

const userSchema = new mongoose.Schema({
  userName: String,
  password: String,
  email: String,
  registerToken: String,
  chatroomIds: [mongoose.Schema.Types.ObjectId],
  isVerified: { type: Boolean, default: false },
});

const UserModel = mongoose.model("user", userSchema);

export const getUsers = async () => {
  const users = await UserModel.find();
  return users.map((u) => u.toObject());
};

export const findUser = (userData) => {
  return UserModel.findOne(userData);
};

export const createUser = (userData) => {
  return UserModel.create(userData);
};

export const updateUser = (queryUser, userData) => {
  return UserModel.updateOne(queryUser, userData);
};
