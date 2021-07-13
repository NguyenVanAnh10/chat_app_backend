import UserModel, { UserVerificationModel } from 'models/users';
import Error from 'entities/Error';
import User from 'entities/User';

export const postLogin = async (req, res) => {
  try {
    const { userName, password } = req.body;

    const me = await UserModel.findOne({ userName }).populate('verification');

    if (!me) throw Error.GET_ACCOUNT;
    if (!me.verification.isVerified) throw Error.INVALIDATE_ACCOUNT;

    const isTruePassword = await me.validatePassword(password);
    if (!isTruePassword) throw Error.PASSWORD_IS_WRONG;

    const userToken = await UserModel.generateToken({ userId: me.id });

    res.cookie('user_token', userToken);
    res.json(new User(me));
  } catch (error) {
    console.error(error);
    res.status(401).send({ error });
  }
};

export const postLogout = (req, res) => {
  res.cookie('user_token', '', { maxAge: Date.now() });
  res.json({});
};

export const getValidateRegisteredEmail = async (req, res) => {
  const { registryToken } = req.query;
  try {
    const { userName, email } = await UserModel.decodeToken(registryToken);
    const existAccount = await UserModel.exists({ userName, email });

    if (!existAccount) throw Error.INVALID_TOKEN;

    const isRegisteredAccount = (await UserModel.aggregate([
      {
        $lookup: {
          from: 'user_verifications',
          localField: 'verification',
          foreignField: '_id',
          as: 'verificationArray',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              { $arrayElemAt: ['$verificationArray', 0] }, '$$ROOT',
            ],
          },
        },
      },
      {
        $match: {
          userName, isVerified: true,
        },
      },
    ])
    ).length;
    if (isRegisteredAccount) {
      throw Error.ACCOUNT_ALREADY_REGISTERS;
    }

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const postResetPassword = async (req, res) => {
  const { registryToken, password } = req.body;
  try {
    if (!registryToken || !password) throw Error.NO_PARAMS;

    const { userName, email } = await UserModel.decodeToken(registryToken);
    const isRegisteredAccount = (await UserModel.aggregate([
      {
        $lookup: {
          from: 'user_verifications',
          localField: 'verification',
          foreignField: '_id',
          as: 'verificationArray',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects:
           [{ $arrayElemAt: ['$verificationArray', 0] }, '$$ROOT'],
          },
        },
      },
      {
        $match: {
          userName, isVerified: true, email,
        },
      },
    ])).length;

    if (isRegisteredAccount) {
      throw Error.ACCOUNT_ALREADY_REGISTERS;
    }

    const user = await UserModel.findOne({ userName, email });
    await user.setPassword(password);
    await user.save();

    await UserVerificationModel.updateOne({
      _id: user.verification,
    }, {
      isVerified: true,
      registryToken: '',
    });
    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
