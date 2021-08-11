import { Model, model, Schema } from 'mongoose';

import schemaWrapper from 'ulties/schema';

interface IUserSeenMessage {
  id: string;
  message: string;
  user: string;
  createdAt: Date;
}

const userSeenMessageSchema = schemaWrapper(
  new Schema<IUserSeenMessage>({
    _id: String,
    message: {
      type: String,
      required: true,
      ref: 'messages',
    },
    user: {
      type: String,
      required: true,
      ref: 'users',
    },
    createdAt: Date,
  })
);
userSeenMessageSchema.virtual('messageRef', {
  ref: 'messages',
  localField: 'message',
  foreignField: '_id',
  justOne: true,
});
userSeenMessageSchema.virtual('userRef', {
  ref: 'users',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

export default model<IUserSeenMessage, Model<IUserSeenMessage>>(
  'user_seen_messages',
  userSeenMessageSchema
);
