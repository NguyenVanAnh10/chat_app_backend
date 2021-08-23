import { Schema, model, Types } from 'mongoose';

import Message from 'entities/Message';
import UserSeenMessageModel from 'models/UserSeenMessages';
import ParticipantModel from 'models/Participant';
import CustomError, { Errors } from 'entities/CustomError';
import { IConversation } from 'types/conversation';

import {
  IMessage,
  IMessageModel,
  IMessagesGetting,
  IGettingMessageTotalOptions,
  IMessagesQueryByIds,
  IFindMessage,
  IFindingMessagesAdditionalMatch,
  ITotalQuery,
  IMessagesQuery,
  IBaseMessagesQuery,
} from 'types/message';

const messageSchema = new Schema<IMessage>({
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
  createdAt: { type: Date, default: Date.now },
});

messageSchema.pre('save', function (): void {
  if (!this._id) {
    this._id = new Types.ObjectId().toString();
  }
  if (typeof this._id === 'object') {
    this._id = this._id.toString();
  }
});

messageSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform(_, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

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
  ).map((m: IConversation): string => m.id);
  await this.deleteMany({
    conversation: conversationId,
  });
  await UserSeenMessageModel.deleteMany({
    message: { $in: deletedMessageIds },
  });
};
messageSchema.statics.getMessageNumber = async function ({
  meId,
  ...match
}: ITotalQuery): Promise<number> {
  const query = {
    ...match,
    participants: { $elemMatch: { user: { $eq: meId } } },
  };
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
          $match: query,
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
  { meId, skip = 0, limit = 100, conversationId }: IBaseMessagesQuery,
  additionalMatch?: IFindingMessagesAdditionalMatch,
  totalOptions?: IGettingMessageTotalOptions
): Promise<IMessagesGetting> {
  const match: IMessagesQuery = {
    participants: { $elemMatch: { user: { $eq: meId } } },
    ...additionalMatch,
  };

  let totalQuery: ITotalQuery = { ...additionalMatch, meId };
  if (conversationId) {
    match.conversation = conversationId;
    totalQuery.conversation = conversationId;
  }

  if (conversationId && totalOptions?.byConversation) {
    totalQuery = { meId, conversation: conversationId };
  }

  const total = await (this as IMessageModel).getMessageNumber(totalQuery);
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
  skip = 0,
  limit = 100,
}: IBaseMessagesQuery): Promise<IMessagesGetting> {
  const match: IFindingMessagesAdditionalMatch = {
    usersSeen: meId,
    $or: [{ sender: { $ne: meId } }, { contentType: Message.CONTENT_TYPE_NOTIFICATION }],
  };
  const result = await (this as IMessageModel).findMessages(
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
  skip = 0,
  limit = 100,
}: IBaseMessagesQuery): Promise<IMessagesGetting> {
  const match: IFindingMessagesAdditionalMatch = {
    usersSeen: { $ne: meId },
    $or: [{ sender: { $ne: meId } }, { contentType: Message.CONTENT_TYPE_NOTIFICATION }],
  };
  const result = await (this as IMessageModel).findMessages(
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
  { meId, skip = 0, limit = 100, messageIds = [], conversationId }: IMessagesQueryByIds,
  totalOptions?: IGettingMessageTotalOptions
): Promise<IMessagesGetting> {
  const result = await (this as IMessageModel).findMessages(
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
