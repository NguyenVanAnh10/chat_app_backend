/* eslint-disable no-underscore-dangle */
import {
  getAllRoomsByUserId,
  getRoomByUserId,
  getRoomWithUserIds,
  createRoom,
} from 'models/chat_room';
import { addRoomIdIntoUser } from 'models/user';

export const getChatRooms = async (req, res) => {
  try {
    const { userId } = req.query;
    const chatRooms = await getAllRoomsByUserId(userId);
    res.json(chatRooms);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const getChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.query;
    const room = await getRoomByUserId({ roomId, userId });
    res.json(room);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const postChatRoom = async (req, res) => {
  const { userIds, createrId, name } = req.body;
  try {
    const room = await getRoomWithUserIds(userIds);
    if (!room.length) {
      const createdRoom = await createRoom({
        name,
        createrId,
        userIds,
      });
      for (let i = 0; i < userIds.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await addRoomIdIntoUser(userIds[i], createdRoom._id.toString());
        req.app
          .get('socketio')
          .in(userIds[i])
          .socketsJoin(createdRoom._id.toString());
        req.app.get('socketio').to(userIds[i]).emit('user_has_added_new_room', {
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
