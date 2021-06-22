import { generateToken, decodeToken } from 'ulties/token';
import { sendTokenConfirmationEmail } from 'ulties/email';
import { createUser, isExistUser, updateUser } from 'models/user';
import { ExceptionError, generateCryptPassword } from 'ulties';
import Error from 'entities/Error';

export const postRegisterAccount = async (req, res) => {
  const { userName, email } = req.body;
  try {
    const isExistAccount = await isExistUser({ userName }); // TODO add email

    if (isExistAccount) {
      throw new ExceptionError(Error.createAccount());
    }

    const registryToken = generateToken({ userName, email });
    await sendTokenConfirmationEmail(email, registryToken);

    await createUser({
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

export const getValidateRegisteredEmail = async (req, res) => {
  const { registryToken } = req.query;
  try {
    const { userName, email } = await decodeToken(registryToken);
    const isExistRegisteredAccount = await isExistUser({ userName, email, isVerified: true });

    if (isExistRegisteredAccount) {
      throw new ExceptionError(Error.invalidToken());
    }

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const postSetPasswordRegister = async (req, res) => {
  const { registryToken, password } = req.body;
  try {
    const { userName, email } = await decodeToken(registryToken);
    const isVerifiedAccount = await isExistUser({ userName, email, isVerified: true });
    if (isVerifiedAccount) {
      throw new ExceptionError(Error.createAccount());
    }

    const cryptPassword = await generateCryptPassword(password);
    await updateUser(
      { userName, email },
      {
        isVerified: true,
        password: cryptPassword,
        $unset: { registryToken: '' },
      },
    );
    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
