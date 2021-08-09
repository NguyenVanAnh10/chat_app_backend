import { Model } from 'mongoose';

import Message from 'entities/Message';

enum ContentType {
  TEXT = Message.CONTENT_TYPE_TEXT,
  AUDIO = Message.CONTENT_TYPE_AUDIO,
  VIDEO = Message.CONTENT_TYPE_VIDEO,
  IMAGE = Message.CONTENT_TYPE_IMAGE,
  NOTIFICATION = Message.CONTENT_TYPE_NOTIFICATION,
}

interface IMessage {
  id: string;
  sender: string;
  conversation: string;
  contentType: ContentType;
  content: string;
  createdAt?: Date;
}

interface IMessagesGetting {
  messages: Array<IMessage>;
  total: number;
}
interface IGettingMessageTotalOptions {
  byConversation?: true;
}

interface IFindMessage {
  meId: string;
  messageId: string;
  conversationId: string;
}

interface IFindMessages {
  meId: string;
  skip?: number;
  limit?: number;
  conversationId?: string;
}

interface IFindMessagesByIds extends IFindMessages {
  messageIds: Array<string>;
}

interface IMessageModel extends Model<IMessage> {
  findMessages(
    { meId, skip, limit, conversationId }: IFindMessages,
    additionalMatch?: any,
    totalOptions?: IGettingMessageTotalOptions
  ): Promise<IMessagesGetting>;
  findSeenMessages({ meId, conversationId, skip, limit }: IFindMessages): Promise<IMessagesGetting>;
  findUnseenMessages({
    meId,
    conversationId,
    skip,
    limit,
  }: IFindMessages): Promise<IMessagesGetting>;
  findMessagesByIds(
    { meId, skip, limit, messageIds, conversationId }: IFindMessagesByIds,
    totalOptions?: IGettingMessageTotalOptions
  ): Promise<IMessagesGetting>;
  findMessage({ meId, messageId, conversationId }: IFindMessage): Promise<IMessage>;
  deleteMessage({ meId, messageId }: { meId: string; messageId: string }): Promise<IMessage>;
  deleteAllMessagesOfConversation(conversationId: string): Promise<void>;
}
