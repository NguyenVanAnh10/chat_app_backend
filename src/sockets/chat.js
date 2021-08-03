import { Server } from 'socket.io';

import { ParticipantModel } from 'models/conversations';

const chat = httpServer => {
  const io = new Server(httpServer, {
    path: '/api/v1/socket/',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', socket => {
    socket.on('join_all_conversations', async ({ userId }) => {
      socket.join(userId);
      try {
        (await ParticipantModel.find({ user: userId }))
          .map(c => socket.join(c.conversation));
      } catch (error) {
        socket.emit('error', { error });
      }
    });

    socket.on('call_to', async ({
      signal,
      callerId,
      conversationId,
      addresseeIds = [],
    }) => {
      try {
        let conversation = {};
        if (!conversationId && addresseeIds.length) {
          conversation = await ParticipantModel.findConversationByMembers({
            meId: callerId,
            members: [...addresseeIds, callerId],
          });
          if (!conversation.id) {
            conversation = await ParticipantModel.createConversation({
              meId: callerId,
              userIds: addresseeIds,
              socketIO: io,
            });
          }
        }
        socket.to(conversationId || conversation.id).emit('have_a_coming_call', {
          conversationId: conversationId || conversation.id,
          signal,
          callerId,
        });
      } catch (error) {
        socket.emit('error', { error });
      }
    });

    socket.on('answer_the_call', ({ signal, conversationId }) => {
      socket.to(conversationId).emit('accept_the_call', { signal });
    });
    socket.on('decline_the_incoming_call', ({ callerId, conversationId }) => {
      io.to(conversationId).emit('decline_the_incoming_call', { callerId, conversationId });
    });
    socket.on('end_call', ({ userId, conversationId }) => {
      io.to(conversationId).emit('end_call', { userId });
    });
    socket.on('disconnect', () => {
    });
  });
  return io;
};
export default chat;
