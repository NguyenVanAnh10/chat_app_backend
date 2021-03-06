import { Request, Response } from 'express';

import CustomError, { Errors } from 'entities/CustomError';
import FriendshipModel from 'models/Friendship';
import ConversationModel from 'models/Conversation';

export const postFriendship = async (req: Request, res: Response): Promise<void> => {
  try {
    const meId = req.app.get('meId');
    const { addresseeId } = req.body;
    const existFriendship =
      (await FriendshipModel.exists({
        requester: meId,
        addressee: addresseeId,
      })) ||
      (await FriendshipModel.exists({
        requester: addresseeId,
        addressee: meId,
      }));
    if (existFriendship) throw new CustomError(Errors.FRIENDSHIP_ALREADY_EXISTS);

    await FriendshipModel.create({
      requester: meId,
      addressee: addresseeId,
    });
    const friend = await FriendshipModel.getFriend({ friendId: addresseeId, meId });

    req.app.get('socketio').to(addresseeId).emit('get_new_friend_request');

    res.json(friend);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const putFriendship = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const { friendshipId } = req.params;
    const friendship = await FriendshipModel.findById(friendshipId);
    const meId = req.app.get('meId') as string;

    if (!friendship) throw new CustomError(Errors.FRIENDSHIP_NO_EXIST);
    if (friendship.status === status) throw new CustomError(Errors.FRIENDSHIP_UPDATED);
    friendship.status = status;
    await friendship.save();

    const friendId = friendship.getFriendId(meId);
    if (status === 'ACCEPTED') {
      await ConversationModel.createConversation({
        meId,
        userIds: [friendId],
      });
      req.app.get('socketio').to(friendId).emit('accept_friend_request', { friendId: meId });
    }
    const friend = await FriendshipModel.getFriend({ meId, friendshipId });

    res.json(friend);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const deleteFriendship = async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendshipId } = req.params;

    await FriendshipModel.deleteOne({
      _id: friendshipId,
    });

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const getFriendshipsIncoming = async (req: Request, res: Response): Promise<void> => {
  try {
    const meId = req.app.get('meId');

    const friends = await FriendshipModel.findRequesters({ meId });
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};

export const getFriendshipsOutgoing = async (req: Request, res: Response): Promise<void> => {
  try {
    const meId = req.app.get('meId');

    const friends = await FriendshipModel.findAddressees({ meId });
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: { name: error.name, message: error.message } });
  }
};
