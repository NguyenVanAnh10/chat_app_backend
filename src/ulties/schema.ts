import { Types } from 'mongoose';

// TODO
function schemaWrapper(schema) {
  schema.pre('save', function (): void {
    if (!this._id) {
      this._id = new Types.ObjectId().toString();
    }
    if (typeof this._id === 'object') {
      this._id = this._id.toString();
    }
    if (!this.createdAt) this.createdAt = new Date();
  });
  schema.set('toJSON', {
    virtuals: false,
    versionKey: false,
    transform(_, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  });
  return schema;
}
export default schemaWrapper;
