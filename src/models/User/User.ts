import { model, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import env from 'configs';
import {
  IDecodeToken,
  IDetailUser,
  IDetailUserModel,
  IUser,
  IUserStatic,
  IUserStaticModel,
  IUserVerification,
} from 'types/user';

const userVerificationSchema = new Schema<IUserVerification>({
  _id: String,
  registryToken: String,
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
});

userVerificationSchema.pre('save', function (): void {
  if (!this._id) {
    this._id = new Types.ObjectId().toString();
  }
  if (typeof this._id === 'object') {
    this._id = this._id.toString();
  }
});
export const UserVerificationModel = model('user_verifications', userVerificationSchema);

const userSchema = new Schema<IDetailUser>({
  _id: String,
  userName: { type: String, required: true },
  password: { type: String, default: null },
  email: { type: String, required: true },
  avatar: { type: String, default: '' },
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
  createdAt: { type: Date, default: new Date() },
});

userSchema.pre('save', function (): void {
  if (!this._id) {
    this._id = new Types.ObjectId().toString();
  }
  if (typeof this._id === 'object') {
    this._id = this._id.toString();
  }
});

userSchema.set('toJSON', {
  virtuals: false,
  versionKey: false,
  transform(_, ret) {
    return {
      id: ret._id,
      userName: ret.userName,
      email: ret.email,
      avatar: ret.avatar,
      online: ret.online,
      createdAt: ret.createdAt,
      statics: ret.statics,
    };
  },
});

userSchema.virtual('verificationRef', {
  ref: 'user_verifications',
  localField: 'verification',
  foreignField: '_id',
  justOne: true,
});

userSchema.methods.validatePassword = async function (password: string): Promise<boolean> {
  const result = await bcrypt.compare(password, this.password);
  return result;
};

userSchema.methods.setPassword = async function (password: string): Promise<void> {
  const salt = await bcrypt.genSalt(Number(env.SALT_ROUNDS) || 10);
  this.password = await bcrypt.hash(password, salt);
};
userSchema.statics.generateToken = async function (data: any): Promise<string> {
  const token = await jwt.sign(data, env.SECRET_KEY, {
    expiresIn: 10 * 60 * 60,
  });
  return token;
};

userSchema.statics.decodeToken = async function (token: string): Promise<IDecodeToken> {
  const result = jwt.verify(token, env.SECRET_KEY);
  return result as IDecodeToken;
};

userSchema.statics.createUser = async function ({
  registryToken,
  userName,
  email,
}: {
  registryToken: string;
  userName: string;
  email: string;
}): Promise<void> {
  const verification = await UserVerificationModel.create({ registryToken });
  await this.create({
    userName,
    email,
    verification: verification.id,
  });
};

userSchema.statics.findUser = async function ({
  meId,
  userId,
}: {
  meId: string;
  userId: string;
}): Promise<IUser> {
  const user =
    (
      await this.aggregate([
        {
          $match: {
            _id: userId,
          },
        },
        {
          $lookup: {
            from: 'friendships',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [{ $eq: ['$requester', meId] }, { $eq: ['$addressee', userId] }],
                      },
                      {
                        $and: [{ $eq: ['$addressee', meId] }, { $eq: ['$requester', userId] }],
                      },
                    ],
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
          $project: {
            _id: 0,
            id: '$_id',
            userName: '$userName',
            email: '$email',
            avatar: '$avatar',
            online: '$online',
            friendship: '$friendship',
          },
        },
      ])
    )[0] || {};
  return user as IUser;
};

userSchema.statics.findUsers = async function ({
  meId,
  userIds,
  keyword,
  limit = 100,
  skip = 0,
}: {
  meId: string;
  userIds?: Array<string>;
  keyword?: string;
  limit?: number;
  skip?: number;
}): Promise<Array<IUser>> {
  const users = await this.aggregate([
    {
      $match: {
        $expr: {
          $and: [
            { $ne: ['$_id', meId] },
            {
              $cond: [
                { $ne: [userIds, undefined] },
                { $in: ['$_id', userIds] },
                {
                  $or: [
                    { $regexMatch: { input: '$userName', regex: keyword, options: 'i' } },
                    { $regexMatch: { input: '$email', regex: keyword, options: 'i' } },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'friendships',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [{ $eq: ['$requester', meId] }, { $eq: ['$addressee', '$$userId'] }],
                  },
                  {
                    $and: [{ $eq: ['$addressee', meId] }, { $eq: ['$requester', '$$userId'] }],
                  },
                ],
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
        _id: 0,
        id: '$_id',
        userName: '$userName',
        email: '$email',
        avatar: '$avatar',
        online: '$online',
        friendship: '$friendship',
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);
  return users as Array<IUser>;
};

userSchema.statics.existsUsers = async function (userIds: Array<string>): Promise<boolean> {
  const existed = !(
    await Promise.all(
      userIds.map(userId =>
        this.exists({
          _id: userId,
        })
      )
    )
  ).includes(false);
  return existed;
};
userSchema.statics.findMe = async function (meId: string): Promise<IDetailUser> {
  const me =
    (
      await this.aggregate([
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
      ])
    )[0] || {};
  return me as IDetailUser;
};

const UserModel = model<IDetailUser, IDetailUserModel>('users', userSchema);

const userStaticSchema = new Schema<IUserStatic>({
  _id: String,
  user: {
    type: String,
    ref: 'user',
    required: true,
  },
  icons: [String],
});
userStaticSchema.statics.updateIcon = async function ({
  meId,
  icon,
}: {
  meId: string;
  icon: string;
}): Promise<IUserStatic> {
  const existUserStatic = await this.exists({ user: meId });
  if (!existUserStatic) {
    const userStatic = await this.create({ user: meId, icons: [icon] });
    await UserModel.findByIdAndUpdate(meId, { static: userStatic.id }, { new: true });
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
    { new: true }
  );
  return updatedUserStatic;
};

userStaticSchema.pre('save', function (): void {
  if (!this._id) {
    this._id = new Types.ObjectId().toString();
  }
  if (typeof this._id === 'object') {
    this._id = this._id.toString();
  }
});

export const UserStaticModel = model<IUserStatic, IUserStaticModel>(
  'user_statics',
  userStaticSchema
);
export default UserModel;
