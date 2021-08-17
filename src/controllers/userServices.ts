import { Request, Response } from 'express';

import UserModel, { UserVerificationModel } from 'models/User/User';
import FriendshipModel from 'models/Friendship';
import CustomError, { Errors } from 'entities/CustomError';
import { IUserVerification } from 'types/user';

export const putOnline = async (req: Request, res: Response): Promise<void> => {
  try {
    const meId = req.app.get('meId');
    const socketIO = req.app.get('socketio');

    const { online } = req.body;
    const existMe = await UserModel.exists({ _id: meId });

    if (!existMe) throw new CustomError(Errors.USER_NOT_FOUND);

    const me = await UserModel.findOneAndUpdate({ _id: meId }, { online }, { new: true });
    const friendshipsList = await FriendshipModel.find({
      $or: [{ requester: meId }, { addressee: meId }],
    });

    if (socketIO) {
      friendshipsList.map(friendship =>
        socketIO.to(friendship.getFriendId(meId)).emit('update_user', {
          userId: meId,
        })
      );
    }

    res.json({ id: meId, online: me.online });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const postLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userName, password } = req.body;
    const me = await UserModel.findOne({ userName }).populate('verificationRef');

    if (!me) throw new CustomError(Errors.GET_ACCOUNT);
    if (!(me.verificationRef as IUserVerification).isVerified)
      throw new CustomError(Errors.INVALIDATE_ACCOUNT);

    const isTruePassword = await me.validatePassword(password);
    if (!isTruePassword) throw new CustomError(Errors.PASSWORD_IS_WRONG);

    const userToken = await UserModel.generateToken({ userId: me.id });
    const detailMe = await UserModel.findMe(me.id as string);

    res.cookie('user_token', userToken);
    res.json(detailMe);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: { name: error.name, message: error.message } });
  }
};

export const postLogout = (req: Request, res: Response): void => {
  res.cookie('user_token', '', { maxAge: Date.now() });
  res.json({});
};

export const getValidateRegisteredEmail = async (req: Request, res: Response): Promise<void> => {
  const { registryToken } = req.query;
  try {
    const { userName, email } = await UserModel.decodeToken(registryToken as string);
    const existAccount = await UserModel.exists({ userName, email });

    if (!existAccount) throw new CustomError(Errors.INVALID_TOKEN);

    const isRegisteredAccount = (
      await UserModel.aggregate([
        {
          $lookup: {
            from: 'user_verifications',
            localField: 'verification',
            foreignField: '_id',
            as: 'verificationArray',
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ['$verificationArray', 0] }, '$$ROOT'],
            },
          },
        },
        {
          $match: {
            userName,
            isVerified: true,
          },
        },
      ])
    ).length;
    if (isRegisteredAccount) {
      throw new CustomError(Errors.ACCOUNT_ALREADY_REGISTERS);
    }

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const postResetPassword = async (req: Request, res: Response): Promise<void> => {
  const { registryToken, password } = req.body;
  try {
    if (!registryToken || !password) throw new CustomError(Errors.NO_PARAMS);

    const { userName, email } = await UserModel.decodeToken(registryToken);
    const isRegisteredAccount = (
      await UserModel.aggregate([
        {
          $lookup: {
            from: 'user_verifications',
            localField: 'verification',
            foreignField: '_id',
            as: 'verificationArray',
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ['$verificationArray', 0] }, '$$ROOT'],
            },
          },
        },
        {
          $match: {
            userName,
            isVerified: true,
            email,
          },
        },
      ])
    ).length;

    if (isRegisteredAccount) {
      throw new CustomError(Errors.ACCOUNT_ALREADY_REGISTERS);
    }

    const user = await UserModel.findOne({ userName, email });
    await user.setPassword(password);
    await user.save();

    await UserVerificationModel.updateOne(
      {
        _id: user.verification,
      },
      {
        isVerified: true,
        registryToken: '',
      }
    );
    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};
