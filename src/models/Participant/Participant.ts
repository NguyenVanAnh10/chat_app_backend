import { Schema, model, Types } from 'mongoose';

export interface IParticipant {
  id: string;
  user: string;
  conversation: string;
  createdAt: Date;
}

const participantSchema = new Schema<IParticipant>({
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
  createdAt: { type: Date, default: Date.now },
});

participantSchema.pre('save', function (): void {
  if (!this._id) {
    this._id = new Types.ObjectId().toString();
  }
  if (typeof this._id === 'object') {
    this._id = this._id.toString();
  }
});

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
