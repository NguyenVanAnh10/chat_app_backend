import { findAllRoomsIncludeUser } from "../models/chat_room.js";

export const getChatRooms = async (req, res) => {
  try {
    const { userId } = req.query;
    const chatRooms = await findAllRoomsIncludeUser(userId);
    res.json({ chatRooms });
  } catch (error) {
    res.status(400).json({ error });
  }
};
