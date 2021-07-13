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
    const meId = req.app.get('meId');
    const conversation = await ParticipantModel.findConversation({ meId, conversationId });
    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error });
  }
};

export const postConversation = async (req, res) => {
  const { userIds: stringUserIds, name } = req.body;
  const meId = req.app.get('meId');

  try {
    if (!stringUserIds) throw Error.NO_PARAMS;
    const userIds = stringUserIds.split(',').concat(meId);

    const existUsers = await UserModel.existsUsers(userIds);
    if (!existUsers) throw Error.USER_NOT_FOUND;

    const existConversation = await ParticipantModel.existsConversation(userIds);

    if (existConversation) throw Error.CONVERSATION_ALREADY_EXISTS;

    const createdConversation = await ConversationModel.create({
      name,
      creator: meId,
    });
    await Promise.all(userIds.map(async user => {
      await ParticipantModel.create({ user, conversation: createdConversation.id });
      req.app
        .get('socketio')
        .in(user)
        .socketsJoin(createdConversation.id);
      return req.app.get('socketio').to(user).emit('user_has_added_new_room', {
        creatorId: meId,
        roomId: createdConversation.id,
      });
    }));

    res.json(createdConversation);
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
