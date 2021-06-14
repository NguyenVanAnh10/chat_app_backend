import { generateToken, decodeToken } from 'ulties/token';
import { sendTokenConfirmationEmail } from 'ulties/email';
import { createUser, updateUser } from 'models/user';
import { generateCryptPassword } from 'ulties';

export const postRegister = async (req, res) => {
  const { userName, email } = req.body;
  const registerToken = generateToken({ userName, email });

  try {
    const createdUser = await createUser({
      userName,
      email,
      registerToken,
    });
    sendTokenConfirmationEmail(email, registerToken);
    res.json(createdUser);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const postSetPasswordRegister = async (req, res) => {
  const { token, password } = req.body;
  try {
    const { userName, email } = await decodeToken(token);
    const cryptPassword = await generateCryptPassword(password);
    await updateUser(
      { userName, email },
      {
        isVerified: true,
        registerToken: undefined,
        password: cryptPassword,
      },
    );
    res.json({});
  } catch (error) {
    res.status(400).json({ error });
  }
};
