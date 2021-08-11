import { Schema, model, Model } from 'mongoose';
import { IUser } from 'types/user';
import schemaWrapper from 'ulties/schema';

enum FriendshipStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

interface IFriendship {
  id: string;
  requester: string;
  addressee: string;
  status: FriendshipStatus;
  createdAt?: Date;
  getFriendId(meId: string): string | null;
}

interface IFriendshipModel extends Model<IFriendship> {
  findAddressees({ meId }: { meId: string }): Promise<Array<IUser>>;
  findRequesters({ meId }: { meId: string }): Promise<Array<IUser>>;
  getFriends(meId: string): Promise<Array<IUser>>;
  getFriend({ meId, friendId }: { meId: string; friendId: string }): Promise<IUser>;
  getFriend({ meId, friendshipId }: { meId: string; friendshipId: string }): Promise<IUser>;
  getFriend({
    meId,
    friendId,
    friendshipId,
  }: {
    meId: string;
    friendId: string;
    friendshipId: string;
  }): Promise<IUser>;
  updateFriendship(
    friendshipId: string,
    meId: string,
    data: { status: FriendshipStatus }
  ): Promise<IUser>;
}

const friendshipSchema = schemaWrapper(
  new Schema<IFriendship>({
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
    createdAt: Date,
  })
);

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

friendshipSchema.methods.getFriendId = function getFriendId(meId: string): string | null {
  if (meId === this.requester) return this.addressee;
  if (meId === this.addressee) return this.requester;
  return null;
};

friendshipSchema.statics.findAddressees = async function findAddressees({
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

friendshipSchema.statics.findRequesters = async function findRequesters({
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

friendshipSchema.statics.getFriends = async function getFriends(
  meId: string
): Promise<Array<IUser>> {
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
        me: {
          $cond: {
            if: { $eq: ['$requester', meId] },
            then: '$requester',
            else: '$addressee',
          },
        },
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

  return friends;
};

friendshipSchema.statics.getFriend = async function getFriend({
  meId,
  friendId,
  friendshipId,
}: {
  meId: string;
  friendId: any;
  friendshipId: any;
}): Promise<IUser> {
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
  return <IUser>friend;
};

friendshipSchema.statics.updateFriendship = async function updateFriendship(
  friendshipId: string,
  meId: string,
  data: { status: FriendshipStatus }
): Promise<IUser> {
  await this.updateOne({ _id: friendshipId }, data);
  const friend = await this.getFriend({ friendshipId, meId });
  return friend;
};

export default model<IFriendship, IFriendshipModel>('friendships', friendshipSchema);
