import {
  findAllRoomsIncludeUser,
  findRoomIncludeUser,
  findRoomWithUserIds,
  createRoom,
  getRoomById,
} from "models/chat_room";
import { getUsers, updateUser, addRoomIdIntoUser } from "models/user";

export const getChatRooms = async (req, res) => {
  try {
    const { userId } = req.query;
    const chatRooms = await findAllRoomsIncludeUser(userId);
    res.json(chatRooms);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const getChatRoom = async (req, res) => {
  try {
    const room = await findRoomIncludeUser(req.params.roomId, req.query.userId);
    res.json(room[0]);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const postChatRoom = async (req, res) => {
  const { userIds, createrId, name } = req.body;
  try {
    const room = await findRoomWithUserIds(userIds);
    if (!room.length) {
      const createdRoom = await createRoom({
        name,
        createrId,
        userIds,
      });
      for (let i = 0; i < userIds.length; i++) {
        await addRoomIdIntoUser(userIds[i], createdRoom._id.toString());
        req.app
          .get("socketio")
          .to(userIds[i])
          .socketsJoin(createdRoom._id.toString());
        req.app.get("socketio").to(userIds[i]).emit("user_has_added_new_room", {
          createrId,
          roomId: createdRoom._id.toString(),
        });
      }

      return res.json(createdRoom);
    }
    res.json(room[0]);
  } catch (error) {
    res.status(400).json({ error });
  }
};
