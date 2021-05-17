import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  name: String,
  creater: String,
  createAt: Date,
  userIds: { type: Array, default: [] },
  messageIds: { type: Array, default: [] },
});

const ChatRoomModel = mongoose.model("Chat_room", chatRoomSchema);

export const createRoom = (roomData) => {
  return ChatRoomModel.create(roomData);
};
export const findRoom = (roomData) => {
  return ChatRoomModel.findOne(roomData);
};
export const findRoomWithUserIds = (userIds = []) => {
  const reverseUserIds = [...userIds];
  return ChatRoomModel.aggregate([
    { $match: { userIds: { $in: [userIds, reverseUserIds.reverse()] } } },
  ]);
};
export const findAllRoomsIncludeUser = (userId) => {
  return ChatRoomModel.find({ userIds: { $eq: userId } });
};
export const updateRoom = (queries, roomData) => {
  return ChatRoomModel.updateOne(queries, roomData);
};
