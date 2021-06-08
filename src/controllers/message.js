import mongoose from "mongoose";
import streamifier from "streamifier";

import { uploadFile } from "google_driver";

import {
  findRoom,
  updateRoom as insertMessageIntoRoom,
} from "../models/chat_room.js";
import {
  getMessagesByRoomIdAndUserId,
  createMessage,
  findMessages,
  getMessagesByUserId,
  getOneMessageByUserId,
  updateUserHasSeenMessagesInRoom,
  getMessagesByIds,
} from "../models/message.js";
import { ExceptionError } from "../ulties/index.js";
import Message from "../entities/Message.js";
import Notification from "../entities/Notification.js";

export const getMessages = async (req, res) => {
  const { roomId, userId, haveSeenMessageIds } = req.query;
  try {
    switch (!!roomId) {
      case true:
        if (haveSeenMessageIds) {
          const messagesByIds = await getMessagesByIds(
            roomId,
            haveSeenMessageIds.split(",")
          );
          res.json(messagesByIds);
          return;
        }
        const messagesByRoomIdAndUserId = await getMessagesByRoomIdAndUserId(
          roomId,
          userId
        );
        res.json(messagesByRoomIdAndUserId);
        return;
      default:
        const messagesByUserId = await getMessagesByUserId(userId);
        res.json(messagesByUserId);
        return;
    }
  } catch (error) {
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
    const room = await findRoom({ _id: roomId });
    if (!room) {
      throw new ExceptionError({
        name: "GetRoomError",
        msg: "roomId isn't exist",
      });
    }
    let msg = {};
    switch (contentType) {
      case Message.CONTENT_TYPE_IMAGE:
        const uploadedImage = await uploadFile({
          _id: roomId,
          source: streamifier.createReadStream(
            Buffer.from(base64Image, "base64")
          ),
        });
        msg = await createMessage({
          roomId,
          contentType,
          ...message,
          content: `https://drive.google.com/uc?id=${uploadedImage.data.id}`,
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
      { $push: { messageIds: msg._id.toString() } }
    );
    req.app
      .get("socketio")
      .to(msg.roomId.toString())
      .emit("send_message_success", {
        roomId: msg.roomId,
        senderId: msg.senderId,
        messageId: msg._id,
      });
    res.json({ message: msg });
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const postUserHasSeenMessages = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const haveSeenMessageIds = await updateUserHasSeenMessagesInRoom(
      roomId,
      userId
    );
    req.app
      .get("socketio")
      .to(roomId)
      .emit("user_has_seen_messages", {
        userId,
        roomId,
        haveSeenMessageIds: haveSeenMessageIds.map((m) => m._id)?.join(","),
      });
    res.json(haveSeenMessageIds);
  } catch (error) {
    res.status(400).json({ error });
  }
};
