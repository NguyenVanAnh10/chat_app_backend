import { getMeById } from 'models/user';
import { ExceptionError } from 'ulties';
import { decodeToken } from 'ulties/token';

const getMe = async (req, res) => {
  const { token_user } = req.cookies;
  try {
    if (!token_user) {
      throw new ExceptionError({ name: 'TokenError', msg: 'Invalid token' });
    }
    const { userId } = await decodeToken(token_user);
    const me = await getMeById(userId);
    res.json(me);
  } catch (error) {
    res.status(401).json({ error });
  }
};

export default getMe;
