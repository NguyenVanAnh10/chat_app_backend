import { Model } from 'mongoose';

interface IConversation {
  id: string;
  creator: string;
  name?: string;
  createdAt?: Date;
  members?: Array<IUser>;
}

interface IConversationModel extends Model<IConversation> {
  existsConversation(userIds: Array<string>): Promise<boolean>;
  findConversations({ meId }: { meId: string }): Promise<Array<IConversation>>;
  findConversation(query: { meId: string; conversationId?: string }): Promise<IConversation>;
  findConversation(query: { meId: string; members?: Array<string> }): Promise<IConversation>;
  createConversation(query: {
    meId: string;
    userIds: Array<string>;
    name?: string;
    socketIO?: Server;
  }): Promise<IConversation>;
  updateConversation(
    query: { meId: string; conversationId: string },
    data: { name: string }
  ): Promise<IConversation>;
}
