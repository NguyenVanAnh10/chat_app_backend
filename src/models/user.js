import mongoose from 'mongoose';
import wrapBaseSchema from 'ulties/wrapBaseSchema';

import User from 'entities/User';

const { ObjectId } = mongoose.Types;

const FriendSchema = wrapBaseSchema(new mongoose.Schema({
  friendId: mongoose.Schema.Types.ObjectId,
  createAt: Date,
}));

const userSchema = wrapBaseSchema(new mongoose.Schema({
  userName: String,
  password: String,
  email: String,
  avatar: String,
  registerToken: String,
  chatroomIds: [mongoose.Schema.Types.ObjectId],
  friendIds: [mongoose.Schema.Types.ObjectId],
  isVerified: { type: Boolean, default: false },
  friendRequests: [FriendSchema],
  addFriends: [FriendSchema],
}));

export const UserModel = mongoose.model('user', userSchema);

export const isExistUser = id => UserModel.exists({
  _id: ObjectId(id),
});

export const isFriend = ({ userId, friendId }) => UserModel.exists({
  $and: [
    { _id: ObjectId(userId) },
    { friendIds: ObjectId(friendId) }],
});
export const isSentFriendRequest = ({ userId, friendId }) => UserModel.exists({
  $and: [
    { _id: ObjectId(userId) },
    { 'addFriends.friendId': ObjectId(friendId) },
  ],
});

export const getUsers = keyword => {
  if (!keyword) return UserModel.find();
  return UserModel.find({
    $or: [
      { userName: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
    ],
  });
};

export const getMeById = userId => UserModel.findOne({
  _id:
    ObjectId(userId),
}, User.HIDE_FIELDS_ME);
export const getUserById = userId => UserModel.findOne({
  _id:
    ObjectId(userId),
}, User.HIDE_FIELDS_ME);
export const getUser = userData => UserModel.findOne(userData, User.HIDE_FIELDS_USER);
export const getAllInfoUser = userData => UserModel.findOne(userData);

export const createUser = userData => UserModel.create(userData);

export const updateUser = (queryUser, userData) => UserModel.updateOne(queryUser, userData);

export const updateAvatar = ({ id, avatar }) => UserModel.findOneAndUpdate({
  _id: ObjectId(id),
}, {
  avatar,
}, { new: true });

export const addRoomIdIntoUser = (userId, chatRoomId) => UserModel.updateOne(
  { _id: ObjectId(userId) },
  { $push: { chatroomIds: ObjectId(chatRoomId) } },
);

export const addFriend = (userId, friend) => UserModel.updateOne(
  {
    $and: [
      { _id: ObjectId(userId) },
      { 'addFriends.friendId': { $ne: ObjectId(friend.friendId) } },
    ],
  },
  {
    $push: {
      addFriends: { ...friend, friendId: ObjectId(friend.friendId) },
    },
  },
);

export const addFriendRequest = (friendId, user) => UserModel.updateOne(
  {
    $and: [
      { _id: ObjectId(friendId) },
      { 'friendRequests.friendId': { $ne: ObjectId(user.userId) } },
    ],
  },
  {
    $push: {
      friendRequests: { ...user, friendId: ObjectId(user.userId) },
    },
  },
);

export const getFriendRequest = async ({ friendId, userId }) => {
  const friendRequest = await UserModel.aggregate([
    { $unwind: '$friendRequests' },
    {
      $match: {
        $and: [
          { _id: ObjectId(userId) },
          { 'friendRequests.friendId': ObjectId(friendId) },
        ],
      },
    },
    {
      $addFields: {
        'friendRequests.id': ObjectId(userId),
      },
    },
    {
      $project: {
        'friendRequests._id': 0,
      },
    },
  ]);
  return friendRequest[0]?.friendRequests || null;
};

export const confirmAddFriend = (userId, friendId) => UserModel.updateOne(
  {
    $and: [
      { _id: ObjectId(userId) },
      {
        $or: [
          { 'friendRequests.friendId': ObjectId(friendId) },
          { 'addFriends.friendId': ObjectId(friendId) },
        ],
      },
    ],
  },
  {
    $push: {
      friendIds: ObjectId(friendId),
    },
    $pull: {
      friendRequests: { friendId: ObjectId(friendId) },
      addFriends: { friendId: ObjectId(friendId) },
    },
  },
);

export const removeFriend = (userId, friendId) => UserModel.updateOne(
  {
    $and: [{ _id: ObjectId(userId) }, { friendIds: ObjectId(friendId) }],
  },
  {
    $pull: {
      friendRequests: { friendId: ObjectId(friendId) },
      addFriends: { friendId: ObjectId(friendId) },
      friendIds: ObjectId(friendId),
    },
  },
);
