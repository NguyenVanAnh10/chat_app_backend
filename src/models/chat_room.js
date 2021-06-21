import mongoose from 'mongoose';
import wrapBaseSchema from 'ulties/wrapBaseSchema';
import { UserModel } from './user';

const { ObjectId } = mongoose.Types;

const chatRoomSchema = wrapBaseSchema(new mongoose.Schema({
  name: String,
  createrId: mongoose.Schema.Types.ObjectId,
  createAt: Date,
  userIds: [mongoose.Schema.Types.ObjectId],
  messageIds: [mongoose.Schema.Types.ObjectId],
}));

export const ChatRoomModel = mongoose.model('chat_room', chatRoomSchema);

export const createRoom = ({ createrId, userIds, name }) => ChatRoomModel.create({
  name,
  createrId: ObjectId(createrId),
  createAt: Date.now(),
  userIds: userIds.sort().map(id => ObjectId(id)),
});
export const isExistRoom = roomData => ChatRoomModel.exists(roomData);
export const isExistRoomWithUserIds = (userIds = []) => ChatRoomModel.exists({
  userIds: {
    $in: [userIds.sort().map(u => ObjectId(u))],
  },
});

export const getRoomWithUserIds = (userIds = []) => ChatRoomModel.find({
  userIds: {
    $in: [userIds.sort().map(u => ObjectId(u))],
  },
});
export const getAllRoomsByUserId = async userId => ChatRoomModel.find({
  userIds: ObjectId(userId),
});

export const getAllRoomsByUserIdLookupUsers = async userId => {
  const rooms = await ChatRoomModel.aggregate([
    { $match: { userIds: ObjectId(userId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'userIds',
        foreignField: '_id',
        as: 'members',
      },
    },
    {
      $project: {
        'members.addFriends': 0,
        'members.chatroomIds': 0,
        'members.friendIds': 0,
        'members.friendRequests': 0,
        'members.isVerified': 0,
        'members.password': 0,
        'members.registerToken': 0,
      },
    },
  ]);
  return rooms.map(doc => ChatRoomModel.hydrate({
    ...doc,
    members: doc.members.map(d => UserModel.hydrate(d, {
      addFriends: 0,
      chatroomIds: 0,
      friendIds: 0,
      friendRequests: 0,
      isVerified: 0,
      password: 0,
      registerToken: 0,
    })),
  }));
};

export const getRoomByUserId = async ({ roomId, userId }) => {
  const rooms = await ChatRoomModel.aggregate([
    {
      $match: {
        $and: [
          {
            _id: ObjectId(roomId),
          },
          { userIds: ObjectId(userId) },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userIds',
        foreignField: '_id',
        as: 'members',
      },
    },
    {
      $project: {
        'members.password': 0,
        'members.chatroomIds': 0,
        'members.isVerified': 0,
        'members.registerToken': 0,
        'members.friendRequests': 0,
        'members.friendIds': 0,
        'members.addFriends': 0,
      },
    },
  ]);
  return rooms.map(doc => ChatRoomModel.hydrate({
    ...doc,
    members: doc.members.map(d => UserModel.hydrate(d, {
      addFriends: 0,
      friendIds: 0,
      friendRequests: 0,
      chatroomIds: 0,
      isVerified: 0,
      password: 0,
      registerToken: 0,
    })),
  }))?.[0];
};
export const getRoomById = roomId => ChatRoomModel.aggregate([
  {
    $match: {
      _id: ObjectId(roomId),
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: 'userIds',
      foreignField: '_id',
      as: 'members',
    },
  },
  {
    $project: {
      'members.password': 0,
      'members.chatroomIds': 0,
      'members.isVerified': 0,
      'members.registerToken': 0,
    },
  },
]);
export const updateRoom = (queries, roomData) => ChatRoomModel.updateOne(queries, roomData);
