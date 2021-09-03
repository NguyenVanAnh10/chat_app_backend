import http from 'http';
import socketIO from 'socket.io';

import ParticipantModel from 'models/Participant';
import ConversationModel from 'models/Conversation';
import { IConversation } from 'types/conversation';

const chat = (httpServer: http.Server): socketIO.Server => {
  const io = new socketIO.Server(httpServer, {
    path: '/api/v1/socket/',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  io.on('connection', (socket: socketIO.Socket): void => {
    socket.on('join_all_conversations', async ({ userId }) => {
      socket.join(userId);
      try {
        (await ParticipantModel.find({ user: userId })).map(c => socket.join(c.conversation));
      } catch (error) {
        socket.emit('error', { error });
      }
    });

    socket.on('call_to', async ({ signal, callerId, conversationId, peerIds = [], peerId }) => {
      try {
        let conversation = {} as IConversation;
        if (!conversationId && peerIds.length) {
          conversation = await ConversationModel.findConversation({
            meId: callerId,
            members: peerIds,
          });
          if (!conversation.id) {
            conversation = await ConversationModel.createConversation({
              meId: callerId,
              userIds: peerIds,
              socketIO: io,
            });
          }
        }
        socket.to(peerId).emit('have_a_coming_call', {
          conversationId: conversationId || conversation.id,
          signal,
          callerId,
        });
      } catch (error) {
        socket.emit('error', { error });
      }
    });

    socket.on('share_signal', ({ signal, peerId, meId, callerId }) => {
      socket.to(peerId).emit('receive_signal', { peerId: meId, signal, callerId });
    });

    socket.on('decline_the_incoming_call', ({ callerId, conversationId, peerId }) => {
      io.to(conversationId).emit('decline_the_incoming_call', { callerId, conversationId, peerId });
    });

    socket.on('end_call', ({ userId, conversationId }) => {
      io.to(conversationId).emit('end_call', { userId });
    });

    socket.on('disconnect', () => {});
  });
  return io;
};
export default chat;
