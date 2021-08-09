import { Schema, model } from 'mongoose';

import schemaWrapper from 'ulties/schema';
import Message from 'entities/Message';
import UserSeenMessageModel from 'models/UserSeenMessages';
import ParticipantModel from 'models/Participant';
import CustomError, { Errors } from 'entities/CustomError';

import {
  IMessage,
  IMessageModel,
  IMessagesGetting,
  IFindMessages,
  IGettingMessageTotalOptions,
  IFindMessagesByIds,
  IFindMessage,
} from 'types/message';

const messageSchema = schemaWrapper(
  new Schema<IMessage>({
    id: String,
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
  })
);
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

messageSchema.statics.deleteAllMessagesOfConversation = async function (
  conversationId: string
): Promise<void> {
  const deletedMessageIds = (
    await this.find({
      conversation: conversationId,
      // eslint-disable-next-line no-underscore-dangle
    })
  ).map(m => m._id);
  await this.deleteMany({
    conversation: conversationId,
  });
  await UserSeenMessageModel.deleteMany({
    message: { $in: deletedMessageIds },
  });
};

messageSchema.statics.getMessageNumber = async function ({ meId, ...match }) {
  const count =
    (
      await this.aggregate([
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
      ])
    )[0]?.total || 0;
  return count;
};

messageSchema.statics.findMessage = async function ({
  meId,
  messageId,
  conversationId,
}: IFindMessage): Promise<IMessage> {
  const match = {
    conversation: conversationId,
    participants: { $elemMatch: { user: { $eq: meId } } },
  };

  if (!conversationId) throw new CustomError(Errors.NO_PARAMS);

  const message =
    (
      await this.aggregate([
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
      ])
    )[0] || {};
  return <IMessage>message;
};

messageSchema.statics.deleteMessage = async function ({
  meId,
  messageId,
}: {
  meId: string;
  messageId: string;
}): Promise<IMessage> {
  const message = await this.findById(messageId);
  if (!message) throw new CustomError(Errors.MESSAGE_NO_EXISTS);
  const { conversationRef } = await message.populate('conversationRef').execPopulate();
  const existsUserInConversation = await ParticipantModel.exists({
    // eslint-disable-next-line no-underscore-dangle
    conversation: conversationRef._id,
    user: meId,
  });
  if (!existsUserInConversation) throw new CustomError(Errors.ACCESS_DENIED);
  await this.deleteOne({ _id: messageId });
  return message as IMessage;
};

messageSchema.statics.findMessages = async function (
  { meId, skip, limit, conversationId }: IFindMessages,
  additionalMatch?: any,
  totalOptions?: IGettingMessageTotalOptions
): Promise<IMessagesGetting> {
  const match = {
    participants: { $elemMatch: { user: { $eq: meId } } },
    ...additionalMatch,
  };

  let totalQuery = { ...match, meId };
  if (conversationId) {
    match.conversation = conversationId;
    totalQuery.conversation = conversationId;
  }

  if (conversationId && totalOptions?.byConversation) {
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
      $skip: skip,
    },
    {
      $limit: limit,
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
messageSchema.statics.findSeenMessages = async function ({
  meId,
  conversationId,
  skip,
  limit,
}: IFindMessages): Promise<IMessagesGetting> {
  const match = {
    usersSeenMessage: { $elemMatch: { user: { $eq: meId } } },
    $or: [{ sender: { $ne: meId } }, { contentType: Message.CONTENT_TYPE_NOTIFICATION }],
  };
  const result = await this.findMessages(
    {
      meId,
      conversationId,
      skip,
      limit,
    },
    match
  );

  return result as IMessagesGetting;
};
messageSchema.statics.findUnseenMessages = async function ({
  meId,
  conversationId,
  skip,
  limit,
}: IFindMessages): Promise<IMessagesGetting> {
  const match = {
    'usersSeenMessage.user': { $ne: meId },
    $or: [{ sender: { $ne: meId } }, { contentType: Message.CONTENT_TYPE_NOTIFICATION }],
  };
  const result = await this.findMessages(
    {
      meId,
      conversationId,
      skip,
      limit,
    },
    match
  );
  return result as IMessagesGetting;
};

messageSchema.statics.findMessagesByIds = async function (
  { meId, skip, limit, messageIds, conversationId }: IFindMessagesByIds,
  totalOptions?: IGettingMessageTotalOptions
): Promise<IMessagesGetting> {
  const result = await this.findMessages(
    {
      meId,
      conversationId,
      skip,
      limit,
    },
    {
      _id: { $in: messageIds },
    },
    totalOptions
  );

  return result;
};

export default model<IMessage, IMessageModel>('messages', messageSchema);
