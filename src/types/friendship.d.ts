import { Model } from 'mongoose';
import type { IUser } from './user';

declare enum FriendshipStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
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
  findAddressees({ meId }: { meId: string }): Promise<Array<IUser>>;
  findRequesters({ meId }: { meId: string }): Promise<Array<IUser>>;
  getFriends(meId: string): Promise<Array<IUser>>;
  getFriend({ meId, friendId }: { meId: string; friendId: string }): Promise<IUser>;
  getFriend({ meId, friendshipId }: { meId: string; friendshipId: string }): Promise<IUser>;
  getFriend({
    meId,
    friendId,
    friendshipId,
  }: {
    meId: string;
    friendId: string;
    friendshipId: string;
  }): Promise<IUser>;
  updateFriendship(
    friendshipId: string,
    meId: string,
    data: { status: FriendshipStatus }
  ): Promise<IUser>;
}
