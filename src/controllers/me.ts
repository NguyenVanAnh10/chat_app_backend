import { Request, Response } from 'express';

import UserModel, { UserStaticModel } from 'models/User';
import FriendshipModel from 'models/Friendship';
import { uploadBase64File } from 'google_cloud_storage/alorice';

import CustomError, { Errors } from 'entities/CustomError';
import Image from 'entities/Image';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const meId = req.app.get('meId');

    const me = await UserModel.findMe(meId);
    res.json(me);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error });
  }
};

export const putStaticMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { icon } = req.body;
    const meId = req.app.get('meId');
    if (!icon) throw new CustomError(Errors.NO_PARAMS);
    const result = await UserStaticModel.updateIcon({ meId, icon });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error });
  }
};

export const putMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, base64AvatarImage, ...rest } = req.body;
    const existMe = await UserModel.exists({ _id: id });

    if (!existMe) throw new CustomError(Errors.USER_NOT_FOUND);
    const data = rest || {};

    if (base64AvatarImage) {
      data.avatar = await uploadBase64File({
        id,
        base64: base64AvatarImage,
        destinationFile: Image.AVATAR,
      });
    }

    const me = await UserModel.findOneAndUpdate({ _id: id }, data, { new: true });
    const friendshipsList = await FriendshipModel.find({
      $or: [{ requester: id }, { addressee: id }],
    });

    friendshipsList.map(friendship =>
      req.app.get('socketio').to(friendship.getFriendId(id)).emit('update_user', {
        userId: id,
      })
    );

    res.json(me);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
