import Error from 'entities/Error';
import {
  getAllRoomsByUserId,
  getRoomByUserId,
  isExistRoomWithUserIds,
  createRoom,
} from 'models/chat_room';
import { addRoomIdIntoUser } from 'models/user';
import { ExceptionError } from 'ulties';

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
  const { userIds: userIdsString, createrId, name } = req.body;
  try {
    const userIds = userIdsString.split(',');
    if (userIds.length < 3) {
      throw new ExceptionError(Error.createLessThreeMembersRoom());
    }
    const isExistRoom = await isExistRoomWithUserIds(userIds);
    if (isExistRoom) {
      throw new ExceptionError(Error.createExistRoom());
    }

    const createdRoom = await createRoom({
      name,
      createrId,
      userIds,
    });
    Promise.all(userIds.map(async u => {
      await addRoomIdIntoUser(u, createdRoom.id.toString());
      req.app
        .get('socketio')
        .in(u)
        .socketsJoin(createdRoom.id.toString());
      req.app.get('socketio').to(u).emit('user_has_added_new_room', {
        createrId,
        roomId: createdRoom.id.toString(),
      });
    }));

    return res.json(createdRoom);
  } catch (error) {
    res.status(400).json({ error });
  }
};
