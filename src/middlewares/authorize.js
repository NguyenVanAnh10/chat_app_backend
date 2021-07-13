import Error from 'entities/Error';
import UserModel from 'models/users';

const authorize = async (req, res, next) => {
  const { user_token: userToken } = req.cookies;
  try {
    if (!userToken || typeof userToken !== 'string') throw Error.INVALID_TOKEN;
    const { userId } = await UserModel.decodeToken(userToken);
    req.app.set('meId', userId);
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error });
  }
};
export default authorize;
