import { findRoom } from "../models/chat_room.js";
import { findMessagesByIds } from "../models/message.js";

export const getMessages = async (req, res) => {
  try {
    const { roomId, limit, skip } = req.query;
    const { messageIds } = await findRoom({ _id: roomId });
    const messages = await findMessagesByIds(
      [...messageIds].reverse().slice(skip, limit)
    );
    res.json({ messages });
  } catch (error) {
    res.status(400).json({ error });
  }
};
