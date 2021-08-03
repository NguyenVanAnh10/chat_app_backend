import Error from 'entities/Error';
import mongoose from 'mongoose';
import schemaWrapper from 'ulties/schema';

const participantSchema = schemaWrapper(new mongoose.Schema({
  _id: String,
  user: {
    type: String,
    ref: 'users',
    required: true,
  },
  conversation: {
    type: String,
    ref: 'conversations',
    required: true,
  },
  createdAt: Date,
}));

participantSchema.virtual('userRef', {
  ref: 'users',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

participantSchema.virtual('conversationRef', {
  ref: 'conversations',
  localField: 'conversation',
  foreignField: '_id',
  justOne: true,
});

participantSchema.statics.existsConversation = async function existsConversation(userIds = []) {
  const existed = (await this.aggregate([
    { $sort: { user: 1 } },
    { $group: { _id: '$conversation', users: { $push: '$user' } } },
    { $match: { users: { $eq: userIds.sort() } } },
  ]))[0];
  return existed;
};

participantSchema.statics.findConversations = async function ({ meId }) {
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
participantSchema.statics.findConversation = async function ({ meId, conversationId }) {
  const conversation = await this.aggregate([
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
  return conversation[0] || {};
};

participantSchema.statics.findConversationByMembers = async function ({ meId, members = [] }) {
  const conversation = await this.aggregate([
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
          $eq: [
            '$memberIds', members.sort(),
          ],
        },

      },
    },
  ]);
  return conversation[0] || {};
};

participantSchema.statics.createConversation = async function ({
  meId,
  name,
  socketIO,
  userIds = [],
}) {
  if (!userIds.length) throw Error.NO_PARAMS;

  const existConversation = await this.existsConversation([meId, ...userIds]);
  if (existConversation) throw Error.CONVERSATION_ALREADY_EXISTS;

  const conv = await ConversationModel.create({ creator: meId, name });
  await Promise.all([meId, ...userIds].map(async user => {
    await this.create({ user, conversation: conv.id });
    socketIO
      .in(user)
      .socketsJoin(conv.id);
    return socketIO.to(user).emit('add_new_conversation', {
      creatorId: meId,
      conversationId: conv.id,
    });
  }));

  const conversation = await this.findConversation({
    meId,
    conversationId: conv.id,
  });
  return conversation;
};

export const ParticipantModel = mongoose.model('participants', participantSchema);

const conversationSchema = schemaWrapper(new mongoose.Schema({
  _id: String,
  name: String,
  creator: {
    type: String,
    ref: 'users',
    required: true,
  },
  createdAt: Date,
}));
conversationSchema.virtual('creatorRef', {
  ref: 'users',
  localField: 'creator',
  foreignField: '_id',
  justOne: true,
});

conversationSchema.statics.updateConversation = async function ({ meId, conversationId }, data) {
  const existed = await ParticipantModel.exists({ user: meId, conversation: conversationId });
  if (!existed) throw Error.CONVERSATION_NOT_FOUND;

  const conversation = await this.findOneAndUpdate({
    _id: conversationId,
  },
  data, { new: true });

  return conversation;
};

const ConversationModel = mongoose.model('conversations', conversationSchema);
export default ConversationModel;
