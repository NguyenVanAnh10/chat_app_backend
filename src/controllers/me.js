import FileType from 'file-type';

import UserModel from 'models/users';
import FriendShipModel from 'models/friendships';
import { putFile } from 'awsS3';
import Error from 'entities/Error';
import Image from 'entities/Image';
import User from 'entities/User';

export const getMe = async (req, res) => {
  const { user_token: userToken } = req.cookies;
  try {
    const { userId } = await UserModel.decodeToken(userToken);
    const me = await UserModel.findOne({ _id: userId });
    res.json(new User(me));
  } catch (error) {
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

    const me = await UserModel.findOneAndUpdate({ _id: id }, data);
    const friendShipsList = await FriendShipModel.find({
      $or: [
        { requester: id },
        { addressee: id },
      ],
    });

    friendShipsList.map(friendShip => req.app
      .get('socketio')
      .to(friendShip.getFriendId(id))
      .emit('update_user', {
        userId: id,
      }));

    res.json(new User(me));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
