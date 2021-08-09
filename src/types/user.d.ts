import { Model } from 'mongoose';

interface IUser {
  id: string;
  userName: string;
  email: string;
  online?: boolean;
  avatar?: string;
}

interface IUserVerification {
  id: string;
  registryToken: string;
  isVerified: boolean;
}

interface IDetailUser {
  id: string;
  userName: string;
  password: string;
  email: string;
  avatar: string;
  online: boolean;
  verification: string;
  static: string;
  createdAt: Date;
  verificationRef: any; // TODO
  validatePassword(password: string): Promise<boolean>;
  setPassword(password: string): Promise<void>;
}

interface IDecodeToken {
  userId?: string;
  userName?: string;
  email?: string;
}

interface IDetailUserModel extends Model<IDetailUser> {
  generateToken(data: { userId: string }): Promise<string>;
  generateToken(data: { userName: string; email: string }): Promise<string>;
  decodeToken(token: string): Promise<IDecodeToken>;
  createUser({
    registryToken,
    userName,
    email,
  }: {
    registryToken: string;
    userName: string;
    email: string;
  }): Promise<void>;
  findUser({ meId, userId }: { meId: string; userId: string }): Promise<IUser>;
  findUsers({
    meId,
    userIds,
    keyword,
    limit,
    skip,
  }: {
    meId: string;
    userIds: Array<string>;
    keyword: string;
    limit?: number;
    skip?: number;
  }): Promise<IUser>;
  existsUsers(userIds: Array<string>): Promise<boolean>;
  findMe(meId: string): Promse<IDetailUser>;
}

interface IUserStatic {
  id: string;
  user: string;
  icons: Array<string>;
}

interface IUserStaticModel extends Model<IUserStatic> {
  updateIcon;
}
