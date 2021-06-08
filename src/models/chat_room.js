import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

const chatRoomSchema = new mongoose.Schema({
  name: String,
  createrId: mongoose.Schema.Types.ObjectId,
  createAt: Date,
  userIds: [mongoose.Schema.Types.ObjectId],
  messageIds: [mongoose.Schema.Types.ObjectId],
});

const ChatRoomModel = mongoose.model("chat_room", chatRoomSchema);

export const createRoom = ({ createrId, userIds, name }) => {
  return ChatRoomModel.create({
    name,
    createrId: ObjectId(createrId),
    createAt: Date.now(),
    userIds: userIds.sort().map((id) => ObjectId(id)),
  });
};
export const findRoom = (roomData) => {
  return ChatRoomModel.findOne(roomData);
};
export const findRoomWithUserIds = (userIds = []) => {
  return ChatRoomModel.find({
    userIds: {
      $in: [userIds.sort().map((u) => ObjectId(u))],
    },
  });
};
export const findAllRoomsIncludeUser = (userId) => {
  return ChatRoomModel.aggregate([
    { $match: { userIds: { $eq: ObjectId(userId) } } },
    {
      $lookup: {
        from: "users",
        localField: "userIds",
        foreignField: "_id",
        as: "members",
      },
    },
    {
      $project: {
        "members.password": 0,
        "members.chatroomIds": 0,
        "members.isVerified": 0,
        "members.registerToken": 0,
      },
    },
  ]);

  //return ChatRoomModel.find({ userIds: { $eq: userId } });
};
export const findRoomIncludeUser = (roomId, userId) => {
  return ChatRoomModel.aggregate([
    {
      $match: {
        $and: [
          {
            _id: ObjectId(roomId),
          },
          { userIds: { $eq: ObjectId(userId) } },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userIds",
        foreignField: "_id",
        as: "members",
      },
    },
    {
      $project: {
        "members.password": 0,
        "members.chatroomIds": 0,
        "members.isVerified": 0,
        "members.registerToken": 0,
      },
    },
  ]);
};
export const getRoomById = (roomId) => {
  return ChatRoomModel.aggregate([
    {
      $match: {
        _id: ObjectId(roomId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userIds",
        foreignField: "_id",
        as: "members",
      },
    },
    {
      $project: {
        "members.password": 0,
        "members.chatroomIds": 0,
        "members.isVerified": 0,
        "members.registerToken": 0,
      },
    },
  ]);
};
export const updateRoom = (queries, roomData) => {
  return ChatRoomModel.updateOne(queries, roomData);
};
