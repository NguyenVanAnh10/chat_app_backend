import { Request, Response } from 'express';

import UserModel from 'models/User';
import CustomError, { Errors } from 'entities/CustomError';
import { sendTokenConfirmationEmail } from 'ulties/email';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword = '', userIds = '', limit = 100, skip = 0 } = req.query;
    const meId = req.app.get('meId');
    const users = await UserModel.findUsers({
      meId,
      keyword: keyword as string,
      userIds: (userIds as string).split(',').filter(i => !!i),
      limit: Number.parseInt(limit as string, 10),
      skip: Number.parseInt(skip as string, 10),
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const meId = req.app.get('meId');

  try {
    const user = await UserModel.findUser({ meId, userId });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const postUserRegistration = async (req: Request, res: Response): Promise<void> => {
  const { userName, email } = req.body;
  try {
    if (!userName || !email) throw new CustomError(Errors.NO_PARAMS);

    const existUser = await UserModel.exists({ userName }); // TODO add email

    if (existUser) throw new CustomError(Errors.ACCOUNT_ALREADY_EXISTS);

    const registryToken = await UserModel.generateToken({ userName, email });
    await sendTokenConfirmationEmail(email, registryToken);

    await UserModel.createUser({
      userName,
      email,
      registryToken,
    });

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
