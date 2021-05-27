import mongoose from "mongoose";

import configs from "../configs/index.js";

const { ObjectId } = mongoose.Types;

const userSchema = new mongoose.Schema({
  userName: String,
  password: String,
  email: String,
  registerToken: String,
  chatroomIds: [mongoose.Schema.Types.ObjectId],
  isVerified: { type: Boolean, default: false },
});

const UserModel = mongoose.model("user", userSchema);

export const getUsers = (keyword) => {
  if (!keyword) return UserModel.find();
  return UserModel.find({
    $or: [
      { userName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
    ],
  });
};
export const getUserId = (userId) => {
  return UserModel.findOne({ _id: ObjectId(userId) });
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

export const addRoomIdIntoUser = (userId, chatRoomId) => {
  return UserModel.updateOne(
    { _id: ObjectId(userId) },
    { $push: { chatroomIds: ObjectId(chatRoomId) } }
  );
};
