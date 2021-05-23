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

export const createRoom = (roomData) => {
  return ChatRoomModel.create(roomData);
};
export const findRoom = (roomData) => {
  return ChatRoomModel.findOne(roomData);
};
export const findRoomWithUserIds = (userIds = []) => {
  const reverseUserIds = [...userIds];
  return ChatRoomModel.find({
    userIds: {
      $in: [
        userIds.map((u) => ObjectId(u)),
        reverseUserIds.reverse().map((u) => ObjectId(u)),
      ],
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
  return ChatRoomModel.findOne({
    _id: ObjectId(roomId),
    userIds: { $eq: ObjectId(userId) },
  });
};
export const updateRoom = (queries, roomData) => {
  return ChatRoomModel.updateOne(queries, roomData);
};
