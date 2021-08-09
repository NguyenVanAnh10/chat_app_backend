import { Schema, model } from 'mongoose';
import { Server } from 'socket.io';

import schemaWrapper from 'ulties/schema';
import ParticipantModel from 'models/Participant';
import CustomError, { Errors } from 'entities/CustomError';
import { IConversation, IConversationModel } from 'types/conversation';

const conversationSchema = schemaWrapper(
  new Schema<IConversation>({
    id: String,
    name: String,
    creator: {
      type: String,
      ref: 'users',
      required: true,
    },
    createdAt: Date,
  })
);

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

conversationSchema.statics.findConversationByMembers = async function ({
  meId,
  members = [],
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
            body(memberIds) {
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

conversationSchema.statics.createConversation = async function ({
  meId,
  name,
  socketIO,
  userIds,
}: {
  meId: string;
  name: string;
  socketIO: Server;
  userIds: Array<string>;
}): Promise<IConversation> {
  if (!userIds.length) throw new CustomError(Errors.NO_PARAMS);

  const existConversation = await this.existsConversation([meId, ...userIds]);
  if (existConversation) throw new CustomError(Errors.CONVERSATION_ALREADY_EXISTS);

  const conv = await this.create({ creator: meId, name });
  await Promise.all(
    [meId, ...userIds].map(async user => {
      await ParticipantModel.create({ user, conversation: conv.id });
      socketIO.in(user).socketsJoin(conv.id);
      return socketIO.to(user).emit('add_new_conversation', {
        creatorId: meId,
        conversationId: conv.id,
      });
    })
  );

  const conversation = await this.findConversation({
    meId,
    conversationId: conv.id,
  });
  return conversation;
};

export default model<IConversation, IConversationModel>('conversations', conversationSchema);
