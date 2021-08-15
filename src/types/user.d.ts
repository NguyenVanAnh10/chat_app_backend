import { Model } from 'mongoose';

import type { IFriendship } from './friendship';

interface IUser {
  id: string;
  userName: string;
  email: string;
  online?: boolean;
  avatar?: string;
  friendship?: IFriendship;
}

interface IUserVerification {
  id: string;
  registryToken: string;
  isVerified: boolean;
}

interface IDetailUser {
  id: string;
  userName: string;
  email: string;
  avatar: string;
  online: boolean;
  password?: string;
  createdAt?: Date;
  verification?: string;
  static?: string;
  statics?: IUserStatic;
  verificationRef?: PopulatedDoc<IUserVerification & Document>;
  validatePassword?(password: string): Promise<boolean>;
  setPassword?(password: string): Promise<void>;
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
    keyword,
    limit,
    skip,
  }: {
    meId: string;
    keyword: string;
    limit?: number;
    skip?: number;
  }): Promise<Array<IUser>>;
  findUsers({ meId, userIds }: { meId: string; userIds: Array<string> }): Promise<Array<IUser>>;
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
