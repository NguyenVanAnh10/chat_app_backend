/* eslint-disable no-case-declarations */
import { Request, Response } from 'express';
import { Server } from 'socket.io';

import { uploadBase64File } from 'google_cloud_storage/alorice';
import MessageModel from 'models/Message';
import ParticipantModel from 'models/Participant';
import ConversationModel from 'models/Conversation';
import UserSeenMessageModel from 'models/UserSeenMessages';
import Message from 'entities/Message';
import Image from 'entities/Image';
import CustomError, { Errors } from 'entities/CustomError';

import { IConversation } from 'types/conversation';
import { IMessage } from 'types/message';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const { conversationId, limit, skip, messageIds } = req.query;
  try {
    const meId = req.app.get('meId');

    const query = {
      meId: meId as string,
      conversationId: conversationId as string,
      skip: Number.parseInt(skip as string, 10),
      limit: Number.parseInt(limit as string, 10),
    };
    if (messageIds) {
      const messageByIds = await MessageModel.findMessagesByIds(
        {
          ...query,
          messageIds: (messageIds as string).split(',').filter(i => !!i),
        },
        {
          byConversation: true,
        }
      );
      res.json(messageByIds);
      return;
    }
    const messages = await MessageModel.findMessages(query);

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { conversationId } = req.query;
    const meId = req.app.get('meId') as string;
    const message = await MessageModel.findMessage({
      meId,
      messageId: messageId as string,
      conversationId: conversationId as string,
    });
    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const meId = req.app.get('meId');
    await MessageModel.deleteMessage({ meId, messageId });
    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const postMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId, friendId, base64Image, contentType, ...rest } = req.body;
    const meId = req.app.get('meId') as string;

    const existedConversation = await ParticipantModel.exists({
      user: meId,
      conversation: conversationId,
    });
    if (conversationId && !existedConversation)
      throw new CustomError(Errors.CONVERSATION_NOT_FOUND);

    let message = {} as IMessage;
    let conversation = {} as IConversation;
    if (!conversationId) {
      conversation = await ConversationModel.createConversation({
        meId,
        userIds: [friendId as string],
        socketIO: req.app.get('socketio') as Server,
      });
    }
    switch (contentType) {
      case Message.CONTENT_TYPE_IMAGE:
        const imageUrl = await uploadBase64File({
          id: `${conversationId || conversation.id}-${meId}-${Date.now()}`,
          base64: base64Image,
          destinationFile: Image.MESSAGE,
        });
        message = await MessageModel.create({
          conversation: conversationId || conversation.id,
          contentType,
          ...rest,
          sender: meId,
          content: imageUrl,
        });
        break;
      default:
        message = await MessageModel.create({
          conversation: conversationId || conversation.id,
          contentType,
          ...rest,
          sender: meId,
        });
        break;
    }

    req.app
      .get('socketio')
      .to(conversationId || conversation.id)
      .emit('get_message', {
        conversationId: conversationId || conversation.id,
        senderId: message.sender,
        messageId: message.id,
        messageContentType: message.contentType,
      });
    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getSeenMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId, skip, limit } = req.query;
    const meId = req.app.get('meId');

    const seenMessages = await MessageModel.findSeenMessages({
      meId,
      conversationId: conversationId as string,
      skip: Number.parseInt(skip as string, 10) || 0,
      limit: Number.parseInt(limit as string, 10) || 100,
    });

    res.json(seenMessages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getUnseenMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { skip, limit, conversationId } = req.query;
    const meId = req.app.get('meId');

    const unSeenMessages = await MessageModel.findUnseenMessages({
      meId,
      conversationId: conversationId as string,
      skip: Number.parseInt(skip as string, 10) || 0,
      limit: Number.parseInt(limit as string, 10) || 100,
    });

    res.json(unSeenMessages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const postSeenMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const conversationId = req.body.conversationId as string;
    const meId = req.app.get('meId') as string;

    const unSeenMessages = await MessageModel.findUnseenMessages({ meId, conversationId });

    await UserSeenMessageModel.create(
      unSeenMessages.messages.map(m => ({
        message: m.id,
        user: meId,
      }))
    );
    const messageIds = unSeenMessages.messages.map(m => m.id);
    const result = await MessageModel.findMessagesByIds({ meId, messageIds });
    req.app
      .get('socketio')
      .to(conversationId)
      .emit('seen_messages', {
        seenUserId: meId,
        conversationId,
        messageIds: messageIds.join(','),
      });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
