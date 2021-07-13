import UserModel from 'models/users';
import Error from 'entities/Error';
import { sendTokenConfirmationEmail } from 'ulties/email';

export const getUsers = async (req, res) => {
  try {
    const { keyword, userIds, limit = 100, skip = 0 } = req.query;
    const meId = req.app.get('meId');
    const users = (await UserModel.findUsers({
      meId, keyword, userIds, limit, skip,
    }));

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getUser = async (req, res) => {
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

export const postUserRegistration = async (req, res) => {
  const { userName, email } = req.body;
  try {
    if (!userName || !email) throw Error.NO_PARAMS;

    const existUser = await UserModel.exists({ userName }); // TODO add email

    if (existUser) throw Error.ACCOUNT_ALREADY_EXISTS;

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
