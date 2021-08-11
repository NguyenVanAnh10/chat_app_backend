import { Schema, model } from 'mongoose';

import schemaWrapper from 'ulties/schema';

export interface IParticipant {
  id: string;
  user: string;
  conversation: string;
  createdAt: Date;
}

const participantSchema = schemaWrapper(
  new Schema<IParticipant>({
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
  })
);

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

export default model<IParticipant>('participants', participantSchema);
