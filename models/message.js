import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: String,
  content: String,
  createAt: Date,
});

const MessageModel = mongoose.model("Message", messageSchema);

export const createMessage = (messageData) => {
  return MessageModel.create(messageData);
};

export const findMessagesByIds = (messageIds = []) => {
  return MessageModel.aggregate([
    {
      $match: {
        _id: { $in: messageIds.map((msgId) => mongoose.Types.ObjectId(msgId)) },
      },
    },
  ]);
};
