import Error from 'entities/Error';
import FriendShipModel from 'models/friendships';

export const postFriendship = async (req, res) => {
  try {
    const { userId, addresseeId } = req.body;
    const existFriendship = await FriendShipModel.exists({
      requester: userId,
      addressee: addresseeId,
    });
    if (existFriendship) throw Error.FRIENDSHIP_ALREADY_EXISTS;

    const friendShip = await FriendShipModel.create({
      requester: userId,
      addressee: addresseeId,
    });
    res.json(friendShip);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const putFriendship = async (req, res) => {
  try {
    const { status } = req.body;
    const { friendShipId } = req.params;
    const friendship = await FriendShipModel.findById(friendShipId);

    if (!friendship) throw Error.FRIENDSHIP_NO_EXIST;
    if (friendship.status === status) throw Error.FRIENDSHIP_UPDATED;

    friendship.status = status;
    await friendship.save();

    res.json(friendship);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const deleteFriendship = async (req, res) => {
  try {
    const { friendShipId } = req.params;

    await FriendShipModel.deleteOne({
      _id: friendShipId,
    });

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getFriendShipsIncoming = async (req, res) => {
  try {
    const meId = req.app.get('meId');

    const friends = await FriendShipModel.findRequesters({ meId });
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getFriendshipsOutgoing = async (req, res) => {
  try {
    const meId = req.app.get('meId');

    const friends = await FriendShipModel.findAddressees({ meId });
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
