import Error from 'entities/Error';
import { ExceptionError } from 'ulties';
import { decodeToken } from 'ulties/token';

const authorize = async (req, res, next) => {
  const { token_user } = req.cookies;
  try {
    if (!token_user) {
      throw new ExceptionError(Error.invalidToken());
    }
    await decodeToken(token_user);
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
export default authorize;
