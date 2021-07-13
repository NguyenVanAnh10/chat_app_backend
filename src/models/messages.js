import mongoose from 'mongoose';

import schemaWrapper from 'ulties/schema';
import Message from 'entities/Message';
import Error from 'entities/Error';
import { ParticipantModel } from './conversations';

const messageSchema = schemaWrapper(new mongoose.Schema({
  _id: String,
  sender: {
    type: String,
    required: true,
    ref: 'users',
  },
  conversation: {
    type: String,
    required: true,
    ref: 'conversations',
  },
  contentType: {
    type: String,
    enum: [
      Message.CONTENT_TYPE_TEXT,
      Message.CONTENT_TYPE_AUDIO,
      Message.CONTENT_TYPE_VIDEO,
      Message.CONTENT_TYPE_IMAGE,
      Message.CONTENT_TYPE_NOTIFICATION,
    ],
    default: Message.CONTENT_TYPE_TEXT,
    required: true,
  },
  content: String,
  createdAt: Date,
}));
messageSchema.virtual('senderRef', {
  ref: 'users',
  localField: 'sender',
  foreignField: '_id',
  justOne: true,
});
messageSchema.virtual('conversationRef', {
  ref: 'conversations',
  localField: 'conversation',
  foreignField: '_id',
  justOne: true,
});

const userSeenMessageSchema = schemaWrapper(new mongoose.Schema({
  _id: String,
  message: {
    type: String,
    required: true,
    ref: 'messages',
  },
  user: {
    type: String,
    required: true,
    ref: 'users',
  },
  createdAt: Date,
}));
userSeenMessageSchema.virtual('messageRef', {
  ref: 'messages',
  localField: 'message',
  foreignField: '_id',
  justOne: true,
});
userSeenMessageSchema.virtual('userRef', {
  ref: 'users',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

export const UserSeenMessageModel = mongoose.model('user_seen_messages',
  userSeenMessageSchema);

messageSchema.statics.deleteAllMessagesOfConversation = async function (conversationId) {
  const deletedMessageIds = (await this.find({
    conversation: conversationId,
  // eslint-disable-next-line no-underscore-dangle
  })).map(m => m._id);
  await this.deleteMany({
    conversation: conversationId,
  });
  await UserSeenMessageModel.deleteMany({
    message: { $in: deletedMessageIds },
  });
};

messageSchema.statics.findMessage = async function findMessage({ meId, messageId }) {
  const message = await this.findById(messageId);
  if (!message) return null;
  const { conversationRef } = await message.populate('conversationRef')
    .execPopulate();
  const existsUserInConversation = await ParticipantModel.exists({
    // eslint-disable-next-line no-underscore-dangle
    conversation: conversationRef._id,
    user: meId,
  });
  if (!existsUserInConversation) throw Error.ACCESS_DENIED;
  return message;
};

messageSchema.statics.deleteMessage = async function findMessage({ meId, messageId }) {
  const message = await this.findById(messageId);
  if (!message) throw Error.MESSAGE_NO_EXISTS;
  const { conversationRef } = await message.populate('conversationRef')
    .execPopulate();
  const existsUserInConversation = await ParticipantModel.exists({
    // eslint-disable-next-line no-underscore-dangle
    conversation: conversationRef._id,
    user: meId,
  });
  if (!existsUserInConversation) throw Error.ACCESS_DENIED;
  await this.deleteOne({ _id: messageId });
  return message;
};

messageSchema.statics.findMessages = async function findMessages({
  meId, skip = 0, limit = 100, conversationId,
}) {
  const match = {
    'participants.user': meId,
  };
  if (conversationId) match['conversations._id'] = conversationId;
  const messages = await this.aggregate([
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation',
        foreignField: '_id',
        as: 'conversations',
      },
    },
    {
      $lookup: {
        from: 'participants',
        localField: 'conversations.0._id',
        foreignField: 'conversation',
        as: 'participants',
      },
    },
    {
      $match: match,
    },
    {
      $addFields: {
        id: '$_id',
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        __v: 0,
        conversations: 0,
        participants: 0,
      },
    },
    {
      $skip: Number.parseInt(skip, 10),
    },
    {
      $limit: Number.parseInt(limit, 10),
    },
  ]);

  return messages;
};

messageSchema.statics.findUnseenMessages = async function findUnseenMessages({
  meId, conversationId, skip = 0, limit = 100,
}) {
  const match = {
    'participants.user': meId,
    'usersSeenMessage.user': { $ne: meId },
    sender: { $ne: meId },
  };
  if (conversationId) match['conversations._id'] = conversationId;
  const messages = await this.aggregate([
    {
      $lookup: {
        from: 'user_seen_messages',
        localField: '_id',
        foreignField: 'message',
        as: 'usersSeenMessage',
      },
    },
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation',
        foreignField: '_id',
        as: 'conversations',
      },
    },
    {
      $lookup: {
        from: 'participants',
        localField: 'conversations.0._id',
        foreignField: 'conversation',
        as: 'participants',
      },
    },
    {
      $match: match,
    },
    {
      $addFields: {
        id: '$_id',
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        __v: 0,
        conversations: 0,
        participants: 0,
        usersSeenMessage: 0,
      },
    },
    {
      $skip: Number.parseInt(skip, 10),
    },
    {
      $limit: Number.parseInt(limit, 10),
    },
  ]);

  return messages;
};

messageSchema.statics.findSeenMessages = async function findSeenMessages({
  meId, conversationId, skip = 0, limit = 100,
}) {
  const match = {
    'participants.user': meId,
    'usersSeenMessage.user': meId,
    sender: { $ne: meId },
  };
  if (conversationId) match['conversations._id'] = conversationId;
  const messages = await this.aggregate([
    {
      $lookup: {
        from: 'user_seen_messages',
        localField: '_id',
        foreignField: 'message',
        as: 'usersSeenMessage',
      },
    },
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation',
        foreignField: '_id',
        as: 'conversations',
      },
    },
    {
      $lookup: {
        from: 'participants',
        localField: 'conversations.0._id',
        foreignField: 'conversation',
        as: 'participants',
      },
    },
    {
      $match: match,
    },
    {
      $addFields: {
        id: '$_id',
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 0,
        __v: 0,
        conversations: 0,
        participants: 0,
        'usersSeenMessage._id': 0,
        'usersSeenMessage.message': 0,
        'usersSeenMessage.__v': 0,
      },
    },
    {
      $skip: Number.parseInt(skip, 10),
    },
    {
      $limit: Number.parseInt(limit, 10),
    },
  ]);

  return messages;
};

export default mongoose.model('messages', messageSchema);
