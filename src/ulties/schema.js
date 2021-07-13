import mongoose from 'mongoose';

/* eslint-disable no-underscore-dangle */
const schemaWrapper = schema => {
  schema.pre('save', function preMiddleware(next) {
    if (!this._doc._id) {
      this._doc._id = (new mongoose.Types.ObjectId()).toString();
    }
    if (typeof this._doc._id === 'object') {
      this._doc._id = this._id.toString();
    }
    if (!this._doc.createdAt) this.createdAt = new Date();
    next();
  });
  schema.set('toJSON', {
    virtuals: false,
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  });
  return schema;
};
export default schemaWrapper;
