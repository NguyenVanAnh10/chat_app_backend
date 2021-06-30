/* eslint-disable no-case-declarations */
import FileType from 'file-type';
import { putFile } from 'awsS3';

import {
  isExistRoom,
  updateRoom as insertMessageIntoRoom,
} from 'models/chat_room';
import {
  getMessagesByRoomId,
  createMessage,
  getMessagesByUserId,
  getOneMessageByUserId,
  findOneAndUpdateUserHasSeenMessagesInRoom,
  getMessagesByIds,
} from 'models/message';
import { ExceptionError } from 'ulties/index';
import Message from 'entities/Message';
import Image from 'entities/Image';

export const getMessages = async (req, res) => {
  const {
    roomId, userId, limit = 100, skip = 0, haveSeenMessageIds,
  } = req.query;
  try {
    switch (!!roomId) {
      case true:
        if (haveSeenMessageIds) {
          const messagesByIds = await getMessagesByIds(
            roomId,
            haveSeenMessageIds.split(','),
          );
          res.json(messagesByIds);
          return;
        }
        res.json(await getMessagesByRoomId({
          roomId,
          userId,
          limit,
          skip,
        }));
        return;
      default:
        const messagesByUserId = await getMessagesByUserId(userId);
        res.json(messagesByUserId);
        return;
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.query;

    const message = await getOneMessageByUserId(userId, messageId);
    res.json(message[0]);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const postMessage = async (req, res) => {
  try {
    const { roomId, base64Image, contentType, ...message } = req.body;
    const room = await isExistRoom({ _id: roomId });
    if (!room) {
      throw new ExceptionError({
        name: 'GetRoomError',
        msg: "roomId isn't exist",
      });
    }
    let msg = {};
    switch (contentType) {
      case Message.CONTENT_TYPE_IMAGE:
        const buffer = Buffer.from(base64Image, 'base64');
        const { mime } = await FileType.fromBuffer(buffer);

        const imageUrl = await putFile({
          id: `${roomId}-${message.senderId}-${Date.now()}`,
          content: buffer,
          ContentEncoding: 'base64',
          ContentType: mime,
          imageType: Image.MESSAGE,
        });
        msg = await createMessage({
          roomId,
          contentType,
          ...message,
          content: imageUrl,
          status: true,
        });
        break;
      default:
        msg = await createMessage({
          roomId,
          contentType,
          ...message,
          status: true,
        });
        break;
    }

    await insertMessageIntoRoom(
      { _id: roomId },
      { $push: { messageIds: msg.id.toString() } },
    );
    req.app
      .get('socketio')
      .to(msg.roomId.toString())
      .emit('send_message_success', {
        roomId: msg.roomId,
        senderId: msg.senderId,
        messageId: msg.id,
      });
    res.json({ message: msg });
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const postUserHasSeenMessages = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const haveSeenMessageIds = await findOneAndUpdateUserHasSeenMessagesInRoom(
      roomId,
      userId,
    );
    req.app
      .get('socketio')
      .to(roomId)
      .emit('user_has_seen_messages', {
        userId,
        roomId,
        haveSeenMessageIds: haveSeenMessageIds.map(m => m.id)?.join(','),
      });
    res.json(haveSeenMessageIds);
  } catch (error) {
    res.status(400).json({ error });
  }
};
