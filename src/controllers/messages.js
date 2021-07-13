/* eslint-disable no-case-declarations */
import FileType from 'file-type';
import { putFile } from 'awsS3';

import MessageModel, { UserSeenMessageModel } from 'models/messages';
import { ParticipantModel } from 'models/conversations';
import Message from 'entities/Message';
import Image from 'entities/Image';
import Error from 'entities/Error';

export const getMessages = async (req, res) => {
  const {
    conversationId, limit = 100, skip = 0,
  } = req.query;
  try {
    const meId = req.app.get('meId');
    const messages = await MessageModel.findMessages({ meId, conversationId, skip, limit });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const meId = req.app.get('meId');
    const message = await MessageModel.findMessage({ meId, messageId });
    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const deleteMessage = async (req, res) => {
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

export const postMessage = async (req, res) => {
  try {
    const {
      conversationId, base64Image, contentType, ...rest
    } = req.body;
    const sender = req.app.get('meId');

    const existedConversation = await ParticipantModel.exists({
      user: sender,
      conversation: conversationId,
    });
    if (!existedConversation) throw Error.CONVERSATION_NOT_FOUND;

    let message = {};
    switch (contentType) {
      case Message.CONTENT_TYPE_IMAGE:
        const buffer = Buffer.from(base64Image, 'base64');
        const { mime } = await FileType.fromBuffer(buffer);

        const imageUrl = await putFile({
          id: `${conversationId}-${sender}-${Date.now()}`,
          content: buffer,
          ContentEncoding: 'base64',
          ContentType: mime,
          imageType: Image.MESSAGE,
        });
        message = await MessageModel.create({
          conversation: conversationId,
          contentType,
          ...rest,
          sender,
          content: imageUrl,
        });
        break;
      default:
        message = await MessageModel.create({
          conversation: conversationId,
          contentType,
          ...rest,
          sender,
        });
        break;
    }

    req.app
      .get('socketio')
      .to(conversationId)
      .emit('send_message_success', {
        conversationId,
        sender: message.sender,
        messageId: message.id,
      });
    res.json(new Message(message));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getSeenMessages = async (req, res) => {
  try {
    const { conversationId, skip, limit } = req.query;
    const meId = req.app.get('meId');

    const seenMessages = await MessageModel.findSeenMessages({
      meId, conversationId, skip, limit,
    });

    res.json(seenMessages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const postSeenMessages = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const meId = req.app.get('meId');

    const unSeenMessages = await MessageModel.findUnseenMessages({ meId, conversationId });

    await UserSeenMessageModel.create(unSeenMessages.map(m => ({
      message: m.id,
      user: meId,
    })));

    req.app
      .get('socketio')
      .to(conversationId)
      .emit('user_has_seen_messages', {
        userId: meId,
        conversationId,
        messageIds: unSeenMessages.map(m => m.id).join(','),
      });
    res.json(unSeenMessages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
