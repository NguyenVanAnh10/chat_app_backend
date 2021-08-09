import { Request, Response, NextFunction } from 'express';

import CustomError, { Errors } from 'entities/CustomError';
import UserModel from 'models/User/User';

const authorize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { user_token: userToken } = req.cookies;
  try {
    if (typeof userToken !== 'string') throw new CustomError(Errors.INVALID_TOKEN);
    const { userId } = await UserModel.decodeToken(userToken);
    req.app.set('meId', userId);
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error });
  }
};
export default authorize;
