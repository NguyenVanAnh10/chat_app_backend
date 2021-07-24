import FileType from 'file-type';

import UserModel, { UserStaticModel } from 'models/users';
import FriendshipModel from 'models/friendships';
import { putFile } from 'awsS3';
import Error from 'entities/Error';
import Image from 'entities/Image';
import User from 'entities/User';

export const getMe = async (req, res) => {
  try {
    const meId = req.app.get('meId');

    const me = await UserModel.findMe(meId);
    res.json(me);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error });
  }
};

export const putStaticMe = async (req, res) => {
  try {
    const { icon } = req.body;
    const meId = req.app.get('meId');
    if (!icon) throw Error.NO_PARAMS;
    const result = await UserStaticModel.updateIcon({ meId, icon });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error });
  }
};

export const putMe = async (req, res) => {
  try {
    const { id, base64AvatarImage, ...rest } = req.body;
    const existMe = await UserModel.exists({ _id: id });

    if (!existMe) throw Error.USER_NOT_FOUND;
    const data = rest || {};

    if (base64AvatarImage) {
      const buffer = Buffer.from(base64AvatarImage, 'base64');
      const { mime } = await FileType.fromBuffer(buffer);
      data.avatar = await putFile({
        id,
        content: buffer,
        ContentEncoding: 'base64',
        ContentType: mime,
        imageType: Image.AVATAR,
      });
    }

    const me = await UserModel.findOneAndUpdate({ _id: id }, data, { new: true });
    const friendshipsList = await FriendshipModel.find({
      $or: [
        { requester: id },
        { addressee: id },
      ],
    });

    friendshipsList.map(friendship => req.app
      .get('socketio')
      .to(friendship.getFriendId(id))
      .emit('update_user', {
        userId: id,
      }));

    res.json(new User(me));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
