import { Model, model, Schema, Types } from 'mongoose';

interface IUserSeenMessage {
  id: string;
  message: string;
  user: string;
  createdAt: Date;
}

const userSeenMessageSchema = new Schema<IUserSeenMessage>({
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
  createdAt: { type: Date, default: new Date() },
});
userSeenMessageSchema.pre('save', function (): void {
  if (!this._id) {
    this._id = new Types.ObjectId().toString();
  }
  if (typeof this._id === 'object') {
    this._id = this._id.toString();
  }
});

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
