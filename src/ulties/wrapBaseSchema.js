const wrapBaseSchema = schema => {
  schema.virtual('id').get(function getVirtual() {
    // eslint-disable-next-line no-underscore-dangle
    return this._id;
  });
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    // eslint-disable-next-line no-underscore-dangle
    transform(doc, ret) { delete ret._id; },
  });
  return schema;
};
export default wrapBaseSchema;
