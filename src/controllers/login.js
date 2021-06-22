import Error from 'entities/Error';
import { getAllInfoUser, getMeById } from 'models/user';
import { compareCryptPassword, ExceptionError } from 'ulties';
import { decodeToken, generateToken } from 'ulties/token';

const postLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const { userName, password } = token ? await decodeToken(token) : req.body;
    const account = await getAllInfoUser({ userName });
    if (!account) {
      throw new ExceptionError(Error.getAccount());
    }
    if (!account.isVerified) {
      throw new ExceptionError(Error.invalidateAccount());
    }
    const me = await getMeById(account.id.toString());
    if (token) return res.json(me);

    const checkPassword = await compareCryptPassword(
      password,
      account.password,
    );
    if (!checkPassword) {
      throw new ExceptionError(Error.getPassword());
    }
    const token_user = generateToken({
      userId: account.id.toString(),
    });
    res.cookie('token_user', token_user);
    return res.json(me);
  } catch (error) {
    console.error(error);
    return res.status(401).send({ error });
  }
};

export default postLogin;
