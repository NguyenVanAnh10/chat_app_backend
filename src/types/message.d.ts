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
  usersSeen?: Array<string>;
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

interface IBaseMessagesQuery {
  meId: string;
  skip?: number;
  limit?: number;
  conversationId?: string;
}

interface IMessagesQueryByIds extends IBaseMessagesQuery {
  messageIds: Array<string>;
}

interface IFindingMessagesAdditionalMatch {
  // message's _id in message id array
  _id?: { $in: Array<string> };
  $or?: [{ sender: { $ne: string } }, { contentType: string }];
  // get seen messages || $ne: get unseen messages
  usersSeen?: string | { $ne?: string };
}

interface IMessagesQuery extends IFindingMessagesAdditionalMatch {
  participants?: { $elemMatch: { user: { $eq: string } } };
  conversation?: string;
}

interface ITotalQuery extends IMessagesQuery {
  meId: string;
  conversation?: string;
}

interface IMessageModel extends Model<IMessage> {
  getMessageNumber(query: ITotalQuery): Promise<number>;
  findMessages(
    { meId, skip, limit, conversationId }: IBaseMessagesQuery,
    additionalMatch?: IFindingMessagesAdditionalMatch,
    totalOptions?: IGettingMessageTotalOptions
  ): Promise<IMessagesGetting>;
  findSeenMessages({
    meId,
    conversationId,
    skip,
    limit,
  }: IBaseMessagesQuery): Promise<IMessagesGetting>;
  findUnseenMessages({
    meId,
    conversationId,
    skip,
    limit,
  }: IBaseMessagesQuery): Promise<IMessagesGetting>;
  findMessagesByIds(
    { meId, skip, limit, messageIds, conversationId }: IMessagesQueryByIds,
    totalOptions?: IGettingMessageTotalOptions
  ): Promise<IMessagesGetting>;
  findMessage({ meId, messageId, conversationId }: IFindMessage): Promise<IMessage>;
  deleteMessage({ meId, messageId }: { meId: string; messageId: string }): Promise<IMessage>;
  deleteAllMessagesOfConversation(conversationId: string): Promise<void>;
}
