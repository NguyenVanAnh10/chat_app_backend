import { Request, Response } from 'express';

import FriendshipModel from 'models/Friendship';

export const getFriends = async (req: Request, res: Response): Promise<void> => {
  try {
    const meId = req.app.get('meId');
    const friends = await FriendshipModel.getFriends(meId);
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getFriend = async (req: Request, res: Response): Promise<void> => {
  try {
    const meId = req.app.get('meId');
    const { friendId } = req.params;

    const friend = await FriendshipModel.getFriend({ meId, friendId });
    res.json(friend);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
