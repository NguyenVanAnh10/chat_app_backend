import Friend from 'entities/Friend';
import db from 'models';
import mongoose from 'mongoose';
import schemaWrapper from 'ulties/schema';

const friendShipSchema = schemaWrapper(new mongoose.Schema({
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
  },
  createdAt: Date,
}));

friendShipSchema.virtual('requesterRef', {
  ref: 'users',
  localField: 'requester',
  foreignField: '_id',
  justOne: true,
});

friendShipSchema.virtual('addresseeRef', {
  ref: 'users',
  localField: 'addressee',
  foreignField: '_id',
  justOne: true,
});

friendShipSchema.statics.findAddressees = async function findAddressees({ meId }) {
  const friendShipsOutgoing = await this.find({ requester: meId, status: 'REQUESTED' });
  const friends = await Promise.all(friendShipsOutgoing.map(async friendShip => {
    const friend = await friendShip.getAddressee(meId);
    return new Friend(friend);
  }));
  return friends;
};

friendShipSchema.statics.findRequesters = async function findRequesters({ meId }) {
  const friendShipsIncoming = await this.find({ addressee: meId, status: 'REQUESTED' });
  const friends = await Promise.all(friendShipsIncoming.map(async friendShip => {
    const friend = await friendShip.getRequester(meId);
    return new Friend(friend);
  }));
  return friends;
};

friendShipSchema.methods.getRequester = async function getRequester(meId) {
  if (meId !== this.addressee) return null;
  const { requesterRef } = await this.populate('requesterRef').execPopulate();
  return requesterRef;
};

friendShipSchema.methods.getAddressee = async function getAddressee(meId) {
  if (meId !== this.requester) return null;
  const { addresseeRef } = await this.populate('addresseeRef').execPopulate();
  return addresseeRef;
};

friendShipSchema.methods.getFriendId = function getFriendId(meId) {
  if (meId === this.requester) return this.addressee;
  if (meId === this.addressee) return this.requester;
  return null;
};

friendShipSchema.statics.getFriends = async function getFriends(meId) {
  const friends = await this.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [
              { requester: meId },
              { addressee: meId },
            ],
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
            if: { $eq: ['$requester', meId] }, then: '$requester', else: '$addressee',
          },
        },
        friend: {
          $cond: {
            if: { $ne: ['$requester', meId] }, then: '$requester', else: '$addressee',
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

export default mongoose.model('friend_ships', friendShipSchema);
