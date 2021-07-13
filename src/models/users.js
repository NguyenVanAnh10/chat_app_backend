import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import schemaWrapper from 'ulties/schema';
import env from 'configs';
import Error from 'entities/Error';

export const UserVerificationModel = mongoose.model('user_verifications',
  schemaWrapper(new mongoose.Schema({
    _id: String,
    registryToken: String,
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
  })));

const userSchema = schemaWrapper(new mongoose.Schema({
  _id: String,
  userName: { type: String, required: true },
  password: { type: String, default: null },
  email: { type: String, required: true },
  avatar: String,
  online: { type: Boolean, default: false },
  verification: {
    type: String,
    ref: 'user_verifications',
    required: true,
  },
  createdAt: Date,
}));

userSchema.virtual('verificationRef', {
  ref: 'user_verifications',
  localField: 'verification',
  foreignField: '_id',
  justOne: true,
});

userSchema.methods.validatePassword = async function validatePassword(password) {
  const result = await bcrypt.compare(password, this.password);
  return result;
};

userSchema.methods.setPassword = async function setPassword(password) {
  const salt = await bcrypt.genSalt(Number(env.SALT_ROUNDS) || 10);
  this.password = await bcrypt.hash(password, salt);
};
userSchema.statics.generateToken = async function generateToken(data) {
  const token = await jwt.sign(data, env.SECRET_KEY, {
    expiresIn: 10 * 60 * 60,
  });
  return token;
};

userSchema.statics.decodeToken = async function decodeToken(token) {
  try {
    const result = await jwt.verify(
      token,
      env.SECRET_KEY,
    );
    return result;
  } catch (error) {
    console.error(error);
    throw Error.INVALID_TOKEN;
  }
};

userSchema.statics.createUser = async function createUser({ registryToken, ...rest }) {
  const verification = await UserVerificationModel.create({ registryToken });
  await this.create({
    ...rest,
    verification: verification.id,
  });
};

userSchema.statics.findUser = async function findUser({
  meId, userId,
}) {
  const user = (await this.aggregate([
    {
      $match: {
        _id: userId,
      },
    },
    {
      $lookup:
          {
            from: 'friend_ships',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [{
                      $and: [
                        { $eq: ['$requester', meId] },
                        { $eq: ['$addressee', userId] },
                      ],
                    }, {
                      $and: [
                        { $eq: ['$addressee', meId] },
                        { $eq: ['$requester', userId] },
                      ],
                    }],
                  },
                },
              },
              { $project: { status: 1, requester: 1, addressee: 1, _id: 0 } },
            ],
            as: 'friend_ships',
          },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ friendship: { $arrayElemAt: ['$friend_ships', 0] } }, '$$ROOT'],
        },
      },
    },
    {
      $addFields: {
        id: '$_id',
      },
    },
    {
      $project: {
        password: 0, friend_ships: 0, createdAt: 0, _id: 0, verification: 0, __v: 0,
      },
    },
  ]))[0];
  return user;
};

userSchema.statics.findUsers = async function findUsers({
  meId, userIds = '', keyword = '', limit = 100, skip = 0,
}) {
  const users = await this.aggregate([
    {
      $match: {
        $and: [
          { _id: { $ne: meId } },
          {
            $or: [
              { _id: { $in: userIds.split(',') } },
              { userName: { $regex: keyword, $options: 'i' } },
              { email: { $regex: keyword, $options: 'i' } },
            ],
          },
        ],
      },
    },
    {
      $lookup:
          {
            from: 'friend_ships',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [{
                      $and: [
                        { $eq: ['$requester', meId] },
                        { $eq: ['$addressee', '$$userId'] },
                      ],
                    }, {
                      $and: [
                        { $eq: ['$addressee', meId] },
                        { $eq: ['$requester', '$$userId'] },
                      ],
                    }],
                  },
                },
              },
              { $project: { status: 1, requester: 1, addressee: 1, _id: 0 } },
            ],
            as: 'friend_ships',
          },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ friendship: { $arrayElemAt: ['$friend_ships', 0] } }, '$$ROOT'],
        },
      },
    },
    {
      $addFields: {
        id: '$_id',
      },
    },
    {
      $project: {
        password: 0, friend_ships: 0, createdAt: 0, _id: 0, verification: 0, __v: 0,
      },
    },
    { $skip: Number.parseInt(skip, 10) },
    { $limit: Number.parseInt(limit, 10) },
  ]);
  return users;
};

userSchema.statics.existsUsers = async function existsUsers(userIds = []) {
  const existed = !(await (Promise.all(userIds.map(userId => this.exists({
    _id: userId,
  }))))).includes(false);
  return existed;
};

export default mongoose.model('users', userSchema);
