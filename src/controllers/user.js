import {
  getUsers as getUsersModel,
  getUserById,
  addFriend,
  addFriendRequest,
  getFriendRequest as getFriendRequestModel,
  confirmAddFriend,
  removeFriend,
  isFriend,
  isSentFriendRequest,
  addRoomIdIntoUser,
} from 'models/user';
import { ExceptionError } from 'ulties';
import Error from 'entities/Error';
import { createRoom } from 'models/chat_room';

export const getUsers = async (req, res) => {
  const { keyword } = req.query;
  try {
    const users = await getUsersModel(keyword);
    res.json(users);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const getUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await getUserById(userId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const postAddFriend = async (req, res) => {
  const { userId } = req.params;
  const { friendId } = req.body;

  try {
    const isSentFriendRequestCheck = await isSentFriendRequest({ userId, friendId });
    if (isSentFriendRequestCheck) {
      throw new ExceptionError(Error.REQUEST_FRIEND);
    }

    const isFriendCheck = await isFriend({ userId, friendId });
    if (isFriendCheck) {
      throw new ExceptionError(Error.REQUEST_FRIEND);
    }
    await addFriend(userId, { friendId, createAt: Date.now() });
    await addFriendRequest(friendId, { userId, createAt: Date.now() });
    req.app
      .get('socketio')
      .to(friendId)
      .emit('friend_request', {
        creatorId: userId,
      });

    res.json({ friendId });
  } catch (error) {
    console.error('error add friend', error);
    res.status(400).json({ name: error?.name, message: error?.message });
  }
};

export const postConfirmAddFriend = async (req, res) => {
  const { userId, friendId } = req.params;

  try {
    await confirmAddFriend(userId, friendId);
    await confirmAddFriend(friendId, userId);
    const createdRoom = await createRoom({
      createrId: userId,
      userIds: [userId, friendId],
    });
    await addRoomIdIntoUser(userId, createdRoom.id.toString());
    await addRoomIdIntoUser(friendId, createdRoom.id.toString());
    const createdRoomId = createdRoom.id.toString();
    req.app
      .get('socketio')
      .in(userId)
      .socketsJoin(createdRoomId);
    req.app.get('socketio').to(userId).emit('user_has_added_new_room', {
      roomId: createdRoomId,
    });

    req.app
      .get('socketio')
      .in(friendId)
      .socketsJoin(createdRoomId);
    req.app.get('socketio').to(friendId).emit('user_has_added_new_room', {
      roomId: createdRoomId,
    });

    res.json({ friendId, userId });
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const deleteFriend = async (req, res) => {
  const { userId, friendId } = req.params;

  try {
    await removeFriend(userId, friendId);
    await removeFriend(friendId, userId);
    res.json({});
  } catch (error) {
    res.status(400).json({ error });
  }
};

export const getFriendRequest = async (req, res) => {
  const { userId, friendId } = req.params;

  try {
    const friendRequest = await getFriendRequestModel({ friendId, userId });
    if (!friendRequest) {
      throw new ExceptionError(Error.GET_REQUEST_FRIEND);
    }
    res.json(friendRequest);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
