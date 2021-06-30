import FileType from 'file-type';

import { putFile } from 'awsS3';
import { getMeById, isExistUser, findOneAndUpdateUser } from 'models/user';
import { ExceptionError } from 'ulties';
import { decodeToken } from 'ulties/token';
import Error from 'entities/Error';
import Image from 'entities/Image';

export const getMe = async (req, res) => {
  const { token_user } = req.cookies;
  try {
    if (!token_user) {
      throw new ExceptionError(Error.invalidToken());
    }
    const { userId } = await decodeToken(token_user);
    const me = await getMeById(userId);
    res.json(me);
  } catch (error) {
    res.status(401).json({ error });
  }
};

export const postMe = async (req, res) => {
  try {
    const { id, base64AvatarImage, ...rest } = req.body;
    const isExistMe = await isExistUser({ id });

    if (!isExistMe) {
      throw new ExceptionError({
        name: 'UpdateMe',
        msg: "User isn't exist",
      });
    }
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

    const me = await findOneAndUpdateUser({ id }, data);
    if (rest.frequentlyUsedIcon) {
      res.json(me);
      return;
    }

    me.friendIds?.forEach(friendId => {
      req.app
        .get('socketio')
        .to(friendId.toString())
        .emit('update_user', {
          userId: id,
        });
    });

    res.json(me);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
