import Error from 'entities/Error';
import mongoose from 'mongoose';
import schemaWrapper from 'ulties/schema';

const participantSchema = schemaWrapper(new mongoose.Schema({
  _id: String,
  user: {
    type: String,
    ref: 'users',
    required: true,
  },
  conversation: {
    type: String,
    ref: 'conversations',
    required: true,
  },
  createdAt: Date,
}));

participantSchema.virtual('userRef', {
  ref: 'users',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

participantSchema.virtual('conversationRef', {
  ref: 'conversations',
  localField: 'conversation',
  foreignField: '_id',
  justOne: true,
});

participantSchema.statics.existsConversation = async function existsConversation(userIds = []) {
  const existed = (await this.aggregate([
    { $sort: { user: 1 } },
    { $group: { _id: '$conversation', users: { $push: '$user' } } },
    { $match: { users: { $eq: userIds.sort() } } },
  ]))[0];
  return existed;
};

participantSchema.statics.findConversations = async function ({ meId, skip, limit }) {
  const conversations = await Promise.all((await this.find({ user: meId })
    .skip(Number.parseInt(skip, 10))
    .limit(Number.parseInt(limit, 10)))
    .map(async conversation => {
      const { conversationRef } = await conversation.populate('conversationRef').execPopulate();
      return conversationRef;
    }));
  return conversations;
};
participantSchema.statics.findConversation = async function ({ meId, conversationId }) {
  const conversation = await this.findOne({ user: meId, conversation: conversationId });
  if (!conversation) return null;
  const { conversationRef } = await conversation.populate('conversationRef').execPopulate();
  return conversationRef;
};

export const ParticipantModel = mongoose.model('participants', participantSchema);

const conversationSchema = schemaWrapper(new mongoose.Schema({
  _id: String,
  name: String,
  creator: {
    type: String,
    ref: 'users',
    required: true,
  },
  createdAt: Date,
}));
conversationSchema.virtual('creatorRef', {
  ref: 'users',
  localField: 'creator',
  foreignField: '_id',
  justOne: true,
});

conversationSchema.statics.updateConversation = async function ({ meId, conversationId }, data) {
  const existed = await ParticipantModel.exists({ user: meId, conversation: conversationId });
  if (!existed) throw Error.CONVERSATION_NOT_FOUND;

  const conversation = await this.findOneAndUpdate({
    _id: conversationId,
  },
  data, { new: true });

  return conversation;
};

export default mongoose.model('conversations', conversationSchema);
