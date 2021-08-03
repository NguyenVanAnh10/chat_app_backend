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

messageSchema.statics.getMessageNumber = async function getMessageNumber({ meId, ...match }) {
  const count = (await this.aggregate([
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
      $lookup: {
        from: 'user_seen_messages',
        localField: '_id',
        foreignField: 'message',
        as: 'usersSeenMessage',
      },
    },
    {
      $addFields: {
        usersSeen: {
          $map: {
            input: '$usersSeenMessage',
            as: 'row',
            in: '$$row.user',
          },
        },
      },
    },
    {
      $match: match,
    },
    {
      $addFields: { meId },
    },
    {
      $group: {
        _id: '$meId',
        total: { $count: {} },
      },
    },
  ]))[0]?.total || 0;
  return count;
};

messageSchema.statics.findMessage = async function findMessage({
  meId,
  messageId,
  conversationId,
}) {
  const match = {
    conversation: conversationId,
    participants: { $elemMatch: { user: { $eq: meId } } },
  };

  if (!conversationId) throw Error.NO_PARAMS;
  const total = await this.getMessageNumber({ meId, ...match });

  const message = (await this.aggregate([
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
      $match: { _id: messageId, ...match },
    },
    {
      $lookup: {
        from: 'user_seen_messages',
        localField: '_id',
        foreignField: 'message',
        as: 'usersSeenDocument',
      },
    },
    {
      $addFields: {
        usersSeen: {
          $map: {
            input: '$usersSeenDocument',
            as: 'row',
            in: '$$row.user',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        sender: '$sender',
        contentType: '$contentType',
        conversation: '$conversation',
        content: '$content',
        usersSeen: '$usersSeen',
        createdAt: '$createdAt',
      },
    },
  ]))[0] || {};
  return { message, total };
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

// TODO
messageSchema.statics.findMessages = async function findMessages({
  meId,
  skip = 0,
  limit = 100,
  conversationId,
  ...additionalMatch
}, totalOptions) {
  const match = {
    participants: { $elemMatch: { user: { $eq: meId } } },
    ...additionalMatch,
  };

  let totalQuery = { ...match, meId };
  if (conversationId) {
    match.conversation = conversationId;
    totalQuery.conversation = conversationId;
  }

  if (conversationId && totalOptions?.forceFetchingTotalNumberByConversationId) {
    totalQuery = { meId, conversation: conversationId };
  }

  const total = await this.getMessageNumber(totalQuery);
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
      $lookup: {
        from: 'user_seen_messages',
        localField: '_id',
        foreignField: 'message',
        as: 'usersSeenMessage',
      },
    },
    {
      $addFields: {
        usersSeen: {
          $map: {
            input: '$usersSeenMessage',
            as: 'row',
            in: '$$row.user',
          },
        },
      },
    },
    {
      $match: match,
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $skip: Number.parseInt(skip, 10),
    },
    {
      $limit: Number.parseInt(limit, 10),
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        sender: '$sender',
        contentType: '$contentType',
        conversation: '$conversation',
        content: '$content',
        usersSeen: '$usersSeen',
        createdAt: '$createdAt',
      },
    },
  ]);
  return { messages, total };
};

messageSchema.statics.findUnseenMessages = async function findUnseenMessages({
  meId, conversationId, skip = 0, limit = 100,
}) {
  const match = {
    'usersSeenMessage.user': { $ne: meId },
    $or: [{ sender: { $ne: meId } }, { contentType: Message.CONTENT_TYPE_NOTIFICATION }],
  };
  const result = await this.findMessages({
    meId, conversationId, skip, limit, ...match,
  });
  return result;
};

messageSchema.statics.findSeenMessages = async function findSeenMessages({
  meId, conversationId, skip = 0, limit = 100,
}) {
  const match = {
    usersSeenMessage: { $elemMatch: { user: { $eq: meId } } },
    $or: [{ sender: { $ne: meId } }, { contentType: Message.CONTENT_TYPE_NOTIFICATION }],
  };
  const result = await this.findMessages({
    meId, conversationId, skip, limit, ...match,
  });

  return result;
};

messageSchema.statics.findMessagesByIds = async function findMessagesByIds({
  meId,
  conversationId,
  skip = 0,
  limit = 1000,
  messageIds = [],
  forceFetchingTotalNumberByConversationId = false,
}) {
  const match = {
    _id: { $in: messageIds },
  };
  const result = await this.findMessages({
    meId, conversationId, skip, limit, ...match,
  }, { forceFetchingTotalNumberByConversationId });

  return result;
};

export default mongoose.model('messages', messageSchema);
