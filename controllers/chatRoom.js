import {
  findAllRoomsIncludeUser,
  findRoomIncludeUser,
} from "../models/chat_room.js";
import { getUsers } from "../models/user.js";

export const getChatRooms = async (req, res) => {
  try {
    const { userId } = req.query;
    const chatRooms = await findAllRoomsIncludeUser(userId);
    // const users = await getUsers();

    // const chatRoom
    res.json(chatRooms);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const getChatRoom = async (req, res) => {
  try {
    const room = await findRoomIncludeUser(req.params.roomId, req.query.userId);
    res.json({ room });
  } catch (error) {
    res.status(400).json({ error });
  }
};
