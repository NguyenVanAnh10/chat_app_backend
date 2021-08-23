import { Model } from 'mongoose';
import type { IUser } from './user';

declare enum FriendshipStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

interface IFriend extends IUser {
  conversation: string;
}

interface IFriendship {
  id: string;
  requester: string;
  addressee: string;
  status: FriendshipStatus;
  createdAt?: Date;
  getFriendId(meId: string): string | null;
}

interface IFriendshipModel extends Model<IFriendship> {
  findAddressees({ meId }: { meId: string }): Promise<Array<IFriend>>;
  findRequesters({ meId }: { meId: string }): Promise<Array<IFriend>>;
  getFriends(meId: string): Promise<Array<IFriend>>;
  getFriend(query: { meId: string; friendId: string }): Promise<IFriend>;
  getFriend(query: { meId: string; friendshipId: string }): Promise<IFriend>;
  updateFriendship(
    friendshipId: string,
    meId: string,
    data: { status: FriendshipStatus }
  ): Promise<IUser>;
}
