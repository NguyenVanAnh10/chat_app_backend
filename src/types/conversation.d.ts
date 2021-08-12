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
  findConversationByMembers({ meId, members }): Promise<IConversation>;
  findConversation({ meId, conversationId }): Promise<IConversation>;
  createConversation({
    meId,
    name,
    socketIO,
    userIds,
  }: {
    meId: string;
    name?: string;
    socketIO: Server;
    userIds: Array<string>;
  }): Promise<IConversation>;
  updateConversation(
    { meId, conversationId }: { meId: string; conversationId: string },
    data: { name: string }
  ): Promise<IConversation>;
}
