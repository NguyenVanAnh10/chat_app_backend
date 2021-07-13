import FriendShipModel from 'models/friendships';

const getFriends = async (req, res) => {
  try {
    const meId = req.app.get('meId');

    const friends = await FriendShipModel.getFriends(meId);
    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export default getFriends;
