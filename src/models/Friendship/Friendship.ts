import { Schema, model, Types } from 'mongoose';

import ConversationModel from 'models/Conversation';
import { FriendshipStatus, IFriend, IFriendship, IFriendshipModel } from 'types/friendship';
import { IUser } from 'types/user';

const friendshipSchema = new Schema<IFriendship>({
  _id: String,
  requester: {
    type: String,
    required: true,
  },
  addressee: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'ACCEPTED', 'DECLINED'],
    default: 'REQUESTED',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

friendshipSchema.pre('save', function (): void {
  if (!this._id) {
    this._id = new Types.ObjectId().toString();
  }
  if (typeof this._id === 'object') {
    this._id = this._id.toString();
  }
});

friendshipSchema.virtual('requesterRef', {
  ref: 'users',
  localField: 'requester',
  foreignField: '_id',
  justOne: true,
});

friendshipSchema.virtual('addresseeRef', {
  ref: 'users',
  localField: 'addressee',
  foreignField: '_id',
  justOne: true,
});

friendshipSchema.methods.getFriendId = function (meId: string): string | null {
  if (meId === this.requester) return this.addressee;
  if (meId === this.addressee) return this.requester;
  return null;
};

friendshipSchema.statics.findAddressees = async function ({
  meId,
}: {
  meId: string;
}): Promise<Array<IUser>> {
  const users = await this.aggregate([
    {
      $match: { requester: meId, status: 'REQUESTED' },
    },
    {
      $addFields: { friendship: '$$ROOT' },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'requester',
        foreignField: '_id',
        as: 'userRef',
      },
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ['$$ROOT', { $arrayElemAt: ['$userRef', 0] }] },
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        userName: '$userName',
        email: '$email',
        avatar: '$avatar',
        online: '$online',
        'friendship.id': '$friendship._id',
        'friendship.requester': '$friendship.requester',
        'friendship.addressee': '$friendship.addressee',
        'friendship.status': '$friendship.status',
      },
    },
  ]);
  return users;
};

friendshipSchema.statics.findRequesters = async function ({
  meId,
}: {
  meId: string;
}): Promise<Array<IUser>> {
  const users = await this.aggregate([
    {
      $match: { addressee: meId, status: 'REQUESTED' },
    },
    {
      $addFields: { friendship: '$$ROOT' },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'requester',
        foreignField: '_id',
        as: 'userRef',
      },
    },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ['$$ROOT', { $arrayElemAt: ['$userRef', 0] }] },
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        userName: '$userName',
        email: '$email',
        avatar: '$avatar',
        online: '$online',
        'friendship.id': '$friendship._id',
        'friendship.requester': '$friendship.requester',
        'friendship.addressee': '$friendship.addressee',
        'friendship.status': '$friendship.status',
      },
    },
  ]);
  return users;
};

friendshipSchema.statics.getFriends = async function (meId: string): Promise<Array<IFriend>> {
  const friends = await this.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [{ requester: meId }, { addressee: meId }],
          },
          {
            status: 'ACCEPTED',
          },
        ],
      },
    },
    {
      $addFields: {
        me: meId,
        friend: {
          $cond: {
            if: { $ne: ['$requester', meId] },
            then: '$requester',
            else: '$addressee',
          },
        },
      },
    },
    {
      $group: {
        _id: '$me',
        friendIds: { $push: '$friend' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'friendIds',
        foreignField: '_id',
        as: 'friends',
      },
    },
    {
      $project: {
        _id: 0,
        friends: {
          $map: {
            input: '$friends',
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
    { $unwind: '$friends' },
    { $replaceWith: '$friends' },
  ]);

  return Promise.all(
    friends.map(async friend => {
      const conversation = await ConversationModel.findConversation({ meId, members: [friend.id] });
      return { ...friend, conversation: conversation.id || '' };
    })
  );
};

friendshipSchema.statics.getFriend = async function ({
  meId,
  friendId,
  friendshipId,
}: {
  meId: string;
  friendshipId?: string;
  friendId?: string;
}): Promise<IFriend> {
  let match = {};
  if (friendId) {
    match = {
      $or: [
        {
          $and: [
            {
              requester: { $eq: friendId },
            },
            {
              addressee: { $eq: meId },
            },
          ],
        },
        {
          $and: [
            {
              requester: { $eq: meId },
            },
            {
              addressee: { $eq: friendId },
            },
          ],
        },
      ],
    };
  }
  if (friendshipId) {
    match = { _id: friendshipId };
  }

  const friend =
    (
      await this.aggregate([
        {
          $match: match,
        },
        {
          $addFields: {
            friendship: '$$ROOT',
            user: {
              $cond: { if: { $ne: ['$addressee', meId] }, then: '$addressee', else: '$requester' },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userRef',
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$$ROOT', { $arrayElemAt: ['$userRef', 0] }],
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: '$_id',
            userName: '$userName',
            email: '$email',
            avatar: '$avatar',
            online: '$online',
            'friendship.id': '$friendship._id',
            'friendship.requester': '$friendship.requester',
            'friendship.addressee': '$friendship.addressee',
            'friendship.status': '$friendship.status',
          },
        },
      ])
    )[0] || {};
  const conversation = await ConversationModel.findConversation({ meId, members: [friend.id] });
  return <IFriend>(friend.id ? { ...friend, conversation: conversation.id || '' } : {});
};

friendshipSchema.statics.updateFriendship = async function (
  friendshipId: string,
  meId: string,
  data: { status: FriendshipStatus }
): Promise<IUser> {
  await this.updateOne({ _id: friendshipId }, data);
  const friend = await (this as IFriendshipModel).getFriend({ friendshipId, meId });
  return friend;
};

export default model<IFriendship, IFriendshipModel>('friendships', friendshipSchema);
