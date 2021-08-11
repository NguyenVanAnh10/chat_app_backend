import { Schema, model, Types } from 'mongoose';
import { Server } from 'socket.io';

import ParticipantModel from 'models/Participant';
import CustomError, { Errors } from 'entities/CustomError';
import { IConversation, IConversationModel } from 'types/conversation';

const conversationSchema = new Schema<IConversation>({
  _id: String,
  name: String,
  creator: {
    type: String,
    ref: 'users',
    required: true,
  },
  createdAt: Date,
});

conversationSchema.virtual('creatorRef', {
  ref: 'users',
  localField: 'creator',
  foreignField: '_id',
  justOne: true,
});

conversationSchema.statics.updateConversation = async function (
  { meId, conversationId }: { meId: string; conversationId: string },
  data: { name: string }
): Promise<IConversation> {
  const existed = await ParticipantModel.exists({ user: meId, conversation: conversationId });
  if (!existed) throw new CustomError(Errors.CONVERSATION_NOT_FOUND);

  const conversation = await this.findOneAndUpdate(
    {
      _id: conversationId,
    },
    data,
    { new: true }
  );

  return conversation;
};

conversationSchema.statics.findConversation = async function ({
  meId,
  conversationId,
}: {
  meId: string;
  conversationId: string;
}): Promise<IConversation> {
  const conversation = await ParticipantModel.aggregate([
    {
      $match: {
        user: meId,
        conversation: conversationId,
      },
    },
    {
      $lookup: {
        from: 'participants',
        localField: 'conversation',
        foreignField: 'conversation',
        as: 'participantsRef',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participantsRef.user',
        foreignField: '_id',
        as: 'members',
      },
    },
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation',
        foreignField: '_id',
        as: 'conversationRef',
      },
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ['$$ROOT', { $arrayElemAt: ['$conversationRef', 0] }] },
      },
    },
    {
      $group: {
        _id: '$user',
        conversations: { $push: '$$ROOT' },
      },
    },
    {
      $unwind: '$conversations',
    },
    {
      $replaceWith: '$conversations',
    },
    {
      $project: {
        id: '$_id',
        _id: 0,
        name: '$name',
        creator: '$creator',
        createdAt: '$createdAt',
        members: {
          $map: {
            input: '$members',
            as: 'row',
            in: {
              id: '$$row._id',
              userName: '$$row.userName',
              email: '$$row.email',
              avatar: '$$row.avatar',
              online: '$$row.online',
            },
          },
        },
      },
    },
  ]);
  return <IConversation>(conversation[0] || {});
};

conversationSchema.statics.findConversations = async function ({
  meId,
}: {
  meId: string;
}): Promise<Array<IConversation>> {
  const conversations = await this.aggregate([
    {
      $match: {
        user: meId,
      },
    },
    {
      $lookup: {
        from: 'participants',
        localField: 'conversation',
        foreignField: 'conversation',
        as: 'participantsRef',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participantsRef.user',
        foreignField: '_id',
        as: 'members',
      },
    },
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation',
        foreignField: '_id',
        as: 'conversationRef',
      },
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ['$$ROOT', { $arrayElemAt: ['$conversationRef', 0] }] },
      },
    },
    {
      $group: {
        _id: '$user',
        conversations: { $push: '$$ROOT' },
      },
    },
    {
      $unwind: '$conversations',
    },
    {
      $replaceWith: '$conversations',
    },
    {
      $project: {
        id: '$_id',
        _id: 0,
        name: '$name',
        creator: '$creator',
        createdAt: '$createdAt',
        members: {
          $map: {
            input: '$members',
            as: 'row',
            in: {
              id: '$$row._id',
              userName: '$$row.userName',
              email: '$$row.email',
              avatar: '$$row.avatar',
              online: '$$row.online',
            },
          },
        },
      },
    },
  ]);
  return conversations;
};

conversationSchema.statics.findConversationByMembers = async function ({
  meId,
  members,
}: {
  meId: string;
  members: Array<string>;
}): Promise<IConversation> {
  const conversation = await ParticipantModel.aggregate([
    {
      $match: {
        user: meId,
      },
    },
    {
      $lookup: {
        from: 'participants',
        localField: 'conversation',
        foreignField: 'conversation',
        as: 'participantsRef',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participantsRef.user',
        foreignField: '_id',
        as: 'members',
      },
    },
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation',
        foreignField: '_id',
        as: 'conversationRef',
      },
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ['$$ROOT', { $arrayElemAt: ['$conversationRef', 0] }] },
      },
    },
    {
      $group: {
        _id: '$user',
        conversations: { $push: '$$ROOT' },
      },
    },
    {
      $unwind: '$conversations',
    },
    {
      $replaceWith: '$conversations',
    },
    {
      $addFields: {
        memberIds: {
          $map: {
            input: '$members',
            as: 'member',
            in: '$$member._id',
          },
        },
      },
    },
    {
      $project: {
        id: '$_id',
        _id: 0,
        name: '$name',
        creator: '$creator',
        createdAt: '$createdAt',
        members: {
          $map: {
            input: '$members',
            as: 'row',
            in: {
              id: '$$row._id',
              userName: '$$row.userName',
              email: '$$row.email',
              avatar: '$$row.avatar',
              online: '$$row.online',
            },
          },
        },
        memberIds: '$memberIds',
      },
    },
    {
      $set: {
        memberIds: {
          $function: {
            body(memberIds: Array<string>) {
              return memberIds.sort();
            },
            args: ['$memberIds'],
            lang: 'js',
          },
        },
      },
    },
    {
      $match: {
        $expr: {
          $eq: ['$memberIds', members.sort()],
        },
      },
    },
  ]);
  return <IConversation>(conversation[0] || {});
};

conversationSchema.statics.existsConversation = async function (
  userIds: Array<string>
): Promise<boolean> {
  const existed = (
    await this.aggregate([
      { $sort: { user: 1 } },
      { $group: { _id: '$conversation', users: { $push: '$user' } } },
      { $match: { users: { $eq: userIds.sort() } } },
    ])
  )[0];
  return existed;
};

conversationSchema.statics.createConversation = async function ({
  meId,
  name,
  socketIO,
  userIds,
}: {
  meId: string;
  name?: string;
  socketIO: Server;
  userIds: Array<string>;
}): Promise<IConversation> {
  if (!userIds.length) throw new CustomError(Errors.NO_PARAMS);

  const existConversation = await (this as IConversationModel).existsConversation([
    meId,
    ...userIds,
  ]);
  if (existConversation) throw new CustomError(Errors.CONVERSATION_ALREADY_EXISTS);

  const conv = (await (this as IConversationModel).create({
    _id: new Types.ObjectId().toString(),
    creator: meId,
    name,
    createdAt: new Date(),
  })) as IConversation;

  await Promise.all(
    [meId, ...userIds].map(async user => {
      await ParticipantModel.create({
        user,
        conversation: conv.id,
        createdAt: new Date(),
      });
      socketIO.in(user).socketsJoin(conv.id);
      return socketIO.to(user).emit('add_new_conversation', {
        creatorId: meId,
        conversationId: conv.id,
      });
    })
  );

  const conversation = await (this as IConversationModel).findConversation({
    meId,
    conversationId: conv.id,
  });
  return conversation;
};

conversationSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform(_, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export default model<IConversation, IConversationModel>('conversations', conversationSchema);
