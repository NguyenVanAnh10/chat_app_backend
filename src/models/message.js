import mongoose from 'mongoose';
import wrapBaseSchema from 'ulties/wrapBaseSchema';
import { ChatRoomModel } from './chat_room';

const { ObjectId } = mongoose.Types;

const messageSchema = wrapBaseSchema(new mongoose.Schema({
  senderId: mongoose.Schema.Types.ObjectId,
  hadSeenMessageUsers: [mongoose.Schema.Types.ObjectId],
  contentType: String, // text | image | video | other files
  content: String,
  createAt: Date,
  roomId: mongoose.Schema.Types.ObjectId,
  keyMsg: String,
  status: Boolean,
}));

const MessageModel = mongoose.model('Message', messageSchema);

export const createMessage = messageData => MessageModel.create(messageData);

export const getMessagesByRoomIdAndUserId = async (roomId, userId) => {
  const messages = await MessageModel.aggregate([
    {
      $lookup: {
        from: 'chat_rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'room',
      },
    },
    {
      $match: {
        $and: [
          { 'room.userIds': ObjectId(userId) },
          { roomId: ObjectId(roomId) },
        ],
      },
    },
    { $unwind: '$room' },
  ]);
  return messages.map(doc => MessageModel.hydrate({
    ...doc,
    room: ChatRoomModel.hydrate(doc.room),
  }));
};

export const getMessagesByUserId = async userId => {
  const messages = await MessageModel.aggregate([
    {
      $lookup: {
        from: 'chat_rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'room',
      },
    },
    {
      $match: {
        'room.userIds': ObjectId(userId),
      },
    },
    { $unwind: '$room' },
  ]);
  return messages.map(doc => MessageModel.hydrate({
    ...doc,
    room: ChatRoomModel.hydrate(doc.room),
  }));
};
export const getOneMessageByUserId = async (userId, messageId) => {
  const messages = await MessageModel.aggregate([
    {
      $lookup: {
        from: 'chat_rooms',
        localField: 'roomId',
        foreignField: '_id',
        as: 'room',
      },
    },
    {
      $match: {
        $and: [
          { 'room.userIds': ObjectId(userId) },
          { _id: ObjectId(messageId) },
        ],
      },
    },
    { $unwind: '$room' },
  ]);
  return messages.map(doc => MessageModel.hydrate({
    ...doc,
    room: ChatRoomModel.hydrate(doc.room),
  }));
};

export const getMessagesByIds = (roomId, ids = []) => MessageModel.find({
  _id: { $in: ids.map(id => ObjectId(id)) },
  roomId,
});
export const findMessages = ({
  limit,
  ...queries
}) => MessageModel.find(queries).sort({
  createAt: -1,
}).limit(limit);

export const findMessagesByUserId = (roomId, messageId) => MessageModel.findOne({
  _id: ObjectId(messageId),
  roomId: ObjectId(roomId),
});

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
    { $push: { hadSeenMessageUsers: ObjectId(userId) } },
  );
  const seenMessages = await MessageModel.find({
    _id: { $in: seenMessageIds },
  });
  return seenMessages || [];
};
