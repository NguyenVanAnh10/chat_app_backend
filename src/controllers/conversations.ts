import { Request, Response } from 'express';

import ParticipantModel from 'models/Participant';
import ConversationModel from 'models/Conversation';
import UserModel from 'models/User/User';
import MessageModel from 'models/Message';
import CustomError, { Errors } from 'entities/CustomError';
import Message from 'entities/Message';
import Notification from 'entities/Notification';

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const meId = req.app.get('meId');
    const conversations = await ConversationModel.findConversations({ meId, hasMessage: true });
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const members = req.query.members as string;
    const meId = req.app.get('meId');
    let conversation = {};

    if (members) {
      conversation = await ConversationModel.findConversation({
        meId,
        members: members.split(',').filter(i => !!i),
      });
      res.json(conversation);
      return;
    }
    conversation = await ConversationModel.findConversation({ meId, conversationId });
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const postConversation = async (req: Request, res: Response): Promise<void> => {
  const { userIds, name } = req.body;
  const meId = req.app.get('meId');

  try {
    if (!userIds) throw new CustomError(Errors.NO_PARAMS);

    const existUsers = await UserModel.existsUsers([meId, ...userIds]);
    if (!existUsers) throw new CustomError(Errors.USER_NOT_FOUND);

    const conversation = await ConversationModel.createConversation({
      meId,
      name,
      userIds,
      socketIO: req.app.get('socketio'),
    });
    await Promise.all(
      userIds.map((id: string) =>
        MessageModel.create({
          conversation: conversation.id,
          contentType: Message.CONTENT_TYPE_NOTIFICATION,
          content: `${Notification.NOTIFICATION_MEMBER_ADDITION}-${id}`,
          sender: meId,
        })
      )
    );
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const putConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const meId = req.app.get('meId');

    const { name } = req.body;
    const conversation = await ConversationModel.updateConversation(
      {
        conversationId,
        meId,
      },
      { name }
    );

    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const existConversation = await ConversationModel.exists({ _id: conversationId });
    if (!existConversation) throw new CustomError(Errors.CONVERSATION_NOT_FOUND);

    await ConversationModel.deleteOne({
      _id: conversationId,
    });
    await ParticipantModel.deleteMany({
      conversation: conversationId,
    });
    await MessageModel.deleteAllMessagesOfConversation(conversationId);

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};
