import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

const messageSchema = new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  hadSeenMessageUsers: [mongoose.Schema.Types.ObjectId],
  contentType: String, // text | image | video | other files 
  content: String,
  createAt: Date,
  roomId: mongoose.Schema.Types.ObjectId,
  keyMsg: String,
  status: Boolean,
});

const MessageModel = mongoose.model("Message", messageSchema);

export const createMessage = (messageData) => {
  return MessageModel.create(messageData);
};

export const getMessagesByRoomIdAndUserId = (roomId, userId) => {
  return MessageModel.aggregate([
    {
      $lookup: {
        from: "chat_rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $match: {
        $and: [
          { "room.userIds": ObjectId(userId) },
          { roomId: ObjectId(roomId) },
        ],
      },
    },
    { $unwind: "$room" },
  ]);
};

export const getMessagesByUserId = (userId) => {
  return MessageModel.aggregate([
    {
      $lookup: {
        from: "chat_rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $match: {
        "room.userIds": ObjectId(userId),
      },
    },
    { $unwind: "$room" },
  ]);
};
export const getOneMessageByUserId = (userId, messageId) => {
  return MessageModel.aggregate([
    {
      $lookup: {
        from: "chat_rooms",
        localField: "roomId",
        foreignField: "_id",
        as: "room",
      },
    },
    {
      $match: {
        $and: [
          { "room.userIds": ObjectId(userId) },
          { _id: ObjectId(messageId) },
        ],
      },
    },
    { $unwind: "$room" },
  ]);
};

export const getMessagesByIds = (roomId, ids = []) => {
  return MessageModel.find({
    _id: { $in: ids.map((id) => ObjectId(id)) },
    roomId: roomId,
  });
};
export const findMessages = ({ limit, ...queries }) => {
  return MessageModel.find(queries).sort({ createAt: -1 }).limit(limit);
};
export const findMessagesByUserId = (roomId, messageId) => {
  return MessageModel.findOne({
    _id: ObjectId(messageId),
    roomId: ObjectId(roomId),
  });
};

export const updateUserHasSeenMessagesInRoom = async (roomId, userId) => {
  // TODO
  const seenMessageIds = await MessageModel.aggregate([
    {
      $match: {
        roomId: ObjectId(roomId),
        hadSeenMessageUsers: { $ne: ObjectId(userId) },
      },
    },
    { $project: { _id: 1 } },
  ]);
  await MessageModel.updateMany(
    {
      roomId: ObjectId(roomId),
      hadSeenMessageUsers: { $ne: ObjectId(userId) },
    },
    { $push: { hadSeenMessageUsers: ObjectId(userId) } }
  );
  const seenMessages = await MessageModel.find({
    _id: { $in: seenMessageIds },
  });
  return seenMessages || [];
};
