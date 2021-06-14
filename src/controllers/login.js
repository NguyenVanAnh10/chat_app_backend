import { getAllInfoUser, getMeById, getUser } from 'models/user';
import { compareCryptPassword, ExceptionError } from 'ulties';
import { decodeToken, generateToken } from 'ulties/token';

const postLogin = async (req, res) => {
  const { token } = req.body;
  switch (!!token) {
    case true:
      try {
        const { userName, email } = await decodeToken(token);
        const account = await getUser({ userName, email });
        if (!account.registerToken) {
          throw new ExceptionError({
            name: 'TokenError',
            msg: 'Token is expired',
          });
        }
        return res.json({});
      } catch (error) {
        return res.status(400).json({ error });
      }
    default:
      const { userName, password } = req.body;
      try {
        const account = await getAllInfoUser({ userName });
        if (!account) {
          throw new ExceptionError({
            name: 'AccountError',
            msg: "User doesn't exist",
          });
        }
        const checkPassword = await compareCryptPassword(
          password,
          account.password,
        );
        if (!checkPassword) {
          throw new ExceptionError({
            name: 'AccountError',
            msg: 'Password is wrong',
          });
        }
        const token_user = generateToken({
          // eslint-disable-next-line no-underscore-dangle
          userId: account._id.toString(),
        });
        const me = await getMeById(account.id.toString());
        res.cookie('token_user', token_user);
        return res.json(me);
      } catch (error) {
        return res.status(401).send({ error });
      }
  }
};

export default postLogin;
