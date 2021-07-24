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
  static: {
    type: String,
    ref: 'user_statics',
    required: false,
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
            from: 'friendships',
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
              {
                $project: {
                  id: '$_id',
                  status: '$status',
                  requester: '$requester',
                  addressee: '$addressee',
                  _id: 0,
                },
              },
            ],
            as: 'friendships',
          },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ friendship: { $arrayElemAt: ['$friendships', 0] } }, '$$ROOT'],
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
        password: 0, friendships: 0, createdAt: 0, _id: 0, verification: 0, __v: 0,
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
            from: 'friendships',
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
              {
                $project: {
                  _id: 0,
                  id: '$_id',
                  status: '$status',
                  requester: '$requester',
                  addressee: '$addressee',
                },
              },
            ],
            as: 'friendships',
          },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ friendship: { $arrayElemAt: ['$friendships', 0] } }, '$$ROOT'],
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
        password: 0, friendships: 0, createdAt: 0, _id: 0, verification: 0, __v: 0,
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
userSchema.statics.findMe = async function findMe(meId) {
  const me = (await this.aggregate([
    { $match: { _id: meId } },
    {
      $lookup: {
        from: 'user_statics',
        localField: 'static',
        foreignField: '_id',
        as: 'staticRef',
      },
    },
    {
      $addFields: {
        statics: { $arrayElemAt: ['$staticRef', 0] },
      },
    },
    {
      $project: {
        'statics._id': 0,
        'statics.__v': 0,
        'statics.user': 0,
      },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        userName: '$userName',
        online: '$online',
        avatar: '$avatar',
        email: '$email',
        createdAt: '$createdAt',
        statics: '$statics',
      },
    },

  ]))[0] || {};
  return me;
};

const UserModel = mongoose.model('users', userSchema);

const userStaticSchema = schemaWrapper(new mongoose.Schema({
  _id: String,
  user: {
    type: String,
    ref: 'user',
    required: true,
  },
  icons: [String],
}));

userStaticSchema.statics.updateIcon = async function updateIcon({ meId, icon }) {
  const existUserStatic = await this.exists({ user: meId });
  if (!existUserStatic) {
    const userStatic = await this.create({ user: meId, icons: [icon] });
    await UserModel.findByIdAndUpdate(meId, { static: userStatic.id });
    return userStatic;
  }
  const updatedUserStatic = await this.findOneAndUpdate(
    { user: meId },
    {
      $push: {
        icons: {
          $each: [icon],
          $slice: 20,
          $position: 0,
        },
      },
    },
    { new: true },
  );
  return updatedUserStatic;
};
export const UserStaticModel = mongoose.model('user_statics', userStaticSchema);

export default UserModel;
