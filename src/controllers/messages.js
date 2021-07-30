/* eslint-disable no-case-declarations */
import { uploadBase64File } from 'google_cloud_storage/alorice';

import MessageModel, { UserSeenMessageModel } from 'models/messages';
import { ParticipantModel } from 'models/conversations';
import Message from 'entities/Message';
import Image from 'entities/Image';
import Error from 'entities/Error';

export const getMessages = async (req, res) => {
  const {
    conversationId, limit = 100, skip = 0, messageIds,
  } = req.query;
  try {
    const meId = req.app.get('meId');
    const query = { meId, conversationId, skip, limit };
    if (messageIds) {
      // eslint-disable-next-line no-underscore-dangle
      query._id = { $in: messageIds.split(',') };
    }
    const messages = await MessageModel.findMessages(query, { conversation: true });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { conversationId } = req.query;
    const meId = req.app.get('meId');
    const message = await MessageModel.findMessage({ meId, messageId, conversationId });
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
      conversationId, friendId, base64Image, contentType, ...rest
    } = req.body;
    const meId = req.app.get('meId');

    const existedConversation = await ParticipantModel.exists({
      user: meId,
      conversation: conversationId,
    });
    if (conversationId && !existedConversation) throw Error.CONVERSATION_NOT_FOUND;

    let message = {};
    let conversation = {};
    switch (contentType) {
      case Message.CONTENT_TYPE_IMAGE:
        if (!conversationId) {
          conversation = await ParticipantModel.createConversation({
            meId,
            userIds: [friendId],
            socketIO: req.app.get('socketio'),
          });
        }
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
        if (!conversationId) {
          conversation = await ParticipantModel.createConversation({
            meId,
            userIds: [friendId],
            socketIO: req.app.get('socketio'),
          });
        }
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
      });
    message = new Message(message);
    message.conversation = conversationId || conversation;
    res.json(message);
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

export const getUnseenMessages = async (req, res) => {
  try {
    const { skip, limit, conversationId } = req.query;
    const meId = req.app.get('meId');

    const unSeenMessages = await MessageModel.findUnseenMessages({
      meId,
      skip,
      limit,
      conversationId,
    });

    res.json(unSeenMessages);
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

    await UserSeenMessageModel.create(unSeenMessages.messages.map(m => ({
      message: m.id,
      user: meId,
    })));
    const messageIds = unSeenMessages.messages.map(m => m.id);
    const result = await MessageModel.findMessagesByIds({ meId, conversationId, messageIds });
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
