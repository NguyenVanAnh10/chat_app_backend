export default class Message {
  static CONTENT_TYPE_NOTIFICATION = 'NOTIFICATION';
  static CONTENT_TYPE_IMAGE = 'IMAGE';
  static CONTENT_TYPE_VIDEO = 'VIDEO';
  static CONTENT_TYPE_AUDIO = 'AUDIO';
  static CONTENT_TYPE_TEXT = 'TEXT';

  constructor(message = {}) {
    // eslint-disable-next-line no-underscore-dangle
    this.id = message._id;
    this.sender = message.sender;
    this.conversation = message.conversation;
    this.contentType = message.contentType;
    this.content = message.content;
    this.createdAt = message.createdAt;
  }
}
