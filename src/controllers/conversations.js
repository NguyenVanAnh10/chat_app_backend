import Error from 'entities/Error';
import ConversationModel, { ParticipantModel } from 'models/conversations';
import MessageModel from 'models/messages';
import UserModel from 'models/users';

export const getConversations = async (req, res) => {
  try {
    const { skip = 0, limit = 100 } = req.query;
    const meId = req.app.get('meId');
    const conversations = await ParticipantModel.findConversations({ meId, skip, limit });
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { members = '' } = req.query;
    const meId = req.app.get('meId');
    let conversation = {};
    if (members) {
      conversation = await ParticipantModel.findConversationByMembers({
        meId,
        members: members.split(',').filter(i => !!i),
      });
      res.json(conversation);
      return;
    }
    conversation = await ParticipantModel.findConversation({ meId, conversationId });
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const postConversation = async (req, res) => {
  const { userIds, name } = req.body;
  const meId = req.app.get('meId');

  try {
    if (!userIds) throw Error.NO_PARAMS;

    const existUsers = await UserModel.existsUsers([meId, ...userIds]);
    if (!existUsers) throw Error.USER_NOT_FOUND;

    const conversation = await ParticipantModel.createConversation({
      meId,
      name,
      userIds,
      socketIO: req.app.get('socketio'),
    });
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const putConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const meId = req.app.get('meId');

    const { name } = req.body;
    const conversation = await ConversationModel.updateConversation({
      conversationId, meId,
    }, { name });

    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const existConversation = await ConversationModel.exists({ _id: conversationId });
    if (!existConversation) throw Error.CONVERSATION_NOT_FOUND;

    await ConversationModel.deleteOne({
      _id: conversationId,
    });
    await ParticipantModel.deleteMany({
      conversation: conversationId,
    });
    await MessageModel.deleteAllMessagesOfConversation(conversationId);

    res.json({});
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};
