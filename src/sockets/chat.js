import { Server } from 'socket.io';

import { ParticipantModel } from 'models/conversations';

const chat = httpServer => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', socket => {
    socket.on('join_all_room', async ({ userId }) => {
      socket.join(userId);
      try {
        (await ParticipantModel.find({ user: userId }))
          .map(c => socket.join(c.conversation));
      } catch (error) {
        socket.emit('error', { error });
      }
    });

    socket.on('call_to', ({ signal, id, conversationId }) => {
      io.to(conversationId).emit('a_call_from', {
        conversationId,
        signal,
        id,
      });
    });

    socket.on('answer_call', ({ signal, conversationId }) => {
      socket.to(conversationId).emit('call_accepted', { signal });
    });
    socket.on('decline_incoming_call', ({ callerId, conversationId }) => {
      io.to(conversationId).emit('decline_incoming_call', { callerId, conversationId });
    });
    socket.on('callended', ({ userId, conversationId }) => {
      io.to(conversationId).emit('callended', { userId });
    });
    socket.on('disconnect', () => {
    });
  });
  return io;
};
export default chat;
