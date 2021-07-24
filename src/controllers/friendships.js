import Error from 'entities/Error';
import FriendshipModel from 'models/friendships';

export const postFriendship = async (req, res) => {
  try {
    const meId = req.app.get('meId');
    const { addresseeId } = req.body;
    const existFriendship = (await FriendshipModel.exists({
      requester: meId,
      addressee: addresseeId,
    })) || (await FriendshipModel.exists({
      requester: addresseeId,
      addressee: meId,
    }));
    if (existFriendship) throw Error.FRIENDSHIP_ALREADY_EXISTS;

    const friendship = await FriendshipModel.create({
      requester: meId,
      addressee: addresseeId,
    });
    const friend = await FriendshipModel.getFriend({ friendId: addresseeId, meId });

    req.app.get('socketio')
      .to(addresseeId)
      .emit('get_new_friend_request');

    res.json(friend);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const putFriendship = async (req, res) => {
  try {
    const { status } = req.body;
    const { friendshipId } = req.params;
    const friendship = await FriendshipModel.findById(friendshipId);
    const meId = req.app.get('meId');

    if (!friendship) throw Error.FRIENDSHIP_NO_EXIST;
    if (friendship.status === status) throw Error.FRIENDSHIP_UPDATED;
    friendship.status = status;
    await friendship.save();

    const friend = await FriendshipModel.getFriend({ friendshipId, meId });
    if (status === 'ACCEPTED') {
      req.app.get('socketio')
        .to(friend.id)
        .emit('accept_friend_request', { friendId: meId });
    }

    res.json(friend);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const deleteFriendship = async (req, res) => {
  try {
    const { friendshipId } = req.params;

    await FriendshipModel.deleteOne({
      _id: friendshipId,
    });

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getFriendshipsIncoming = async (req, res) => {
  try {
    const meId = req.app.get('meId');

    const friends = await FriendshipModel.findRequesters({ meId });
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getFriendshipsOutgoing = async (req, res) => {
  try {
    const meId = req.app.get('meId');

    const friends = await FriendshipModel.findAddressees({ meId });
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
