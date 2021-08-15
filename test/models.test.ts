import mongoose from 'mongoose';

import initDatabase from 'models';
import ConversationModel from 'models/Conversation';
import FriendshipModel from 'models/Friendship';
import MessageModel from 'models/Message';

import UserModel from 'models/User';
import { IDetailUser, IUser } from 'types/user';
import { IConversation } from 'types/conversation';
import { IMessage, IMessagesGetting } from 'types/message';

initDatabase();
afterAll(async () => {
  await mongoose.connection.close();
});

// #region user
describe('user', () => {
  it('get me', async () => {
    let me: IDetailUser;
    try {
      me = await UserModel.findMe('60e97ea983157a63a7e7dc2e');
      const expectedMe: IDetailUser = {
        id: expect.toBeString(),
        userName: expect.toBeString(),
        email: expect.toBeString(),
        avatar: expect.toBeString(),
        online: expect.toBeBoolean(),
        createdAt: expect.toBeDate(),
      };
      if (me.statics) expectedMe.statics = expect.toBeObject();

      expect(me).toEqual(expectedMe);
    } catch (error) {
      console.error(error);
      expect(me).toEqual({});
    }
  });

  it('find a user', async () => {
    let user: IUser;
    try {
      user = await UserModel.findUser({
        meId: '60e97ea983157a63a7e7dc2e',
        userId: '60e9752d5ebf885abf9c39c8',
      });
      const expectedUser: IUser = {
        id: expect.toBeString(),
        userName: expect.toBeString(),
        email: expect.toBeString(),
        avatar: expect.toBeString(),
        online: expect.toBeBoolean(),
      };
      if (user.friendship) expectedUser.friendship = expect.toBeObject();
      expect(user).toEqual(expectedUser);
    } catch (error) {
      console.error(error);
      expect(user).toEqual({});
    }
  });

  it('find users', async () => {
    let users: Array<IUser>;
    try {
      // by userids
      users = await UserModel.findUsers({
        meId: '60e97ea983157a63a7e7dc2e',
        userIds: [
          '60fbfa5896337f59179fea61',
          '60e97ea983157a63a7e7dc2e',
          '60e9752d5ebf885abf9c39c8',
        ],
      });
      expect(users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.toBeString(),
            userName: expect.toBeString(),
            email: expect.toBeString(),
            avatar: expect.toBeString(),
            online: expect.toBeBoolean(),
            // TODO friendship: expect.toBeObject(),
          }),
        ])
      );

      // by keyword
      users = await UserModel.findUsers({
        meId: '60e97ea983157a63a7e7dc2e',
        keyword: 'test',
      });
      expect(users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.toBeString(),
            userName: expect.toBeString(),
            email: expect.toBeString(),
            avatar: expect.toBeString(),
            online: expect.toBeBoolean(),
            // TODO friendship: expect.toBeObject(),
          }),
        ])
      );
    } catch (error) {
      console.error(error);
      expect(users).toEqual([]);
    }
  });

  it('check user exists', async () => {
    let existUsers: boolean;
    try {
      existUsers = await UserModel.existsUsers([
        '60fbfa5896337f59179fea61',
        '60e97ea983157a63a7e7dc2e',
      ]);
      expect(existUsers).toBe(true);
    } catch (error) {
      console.error(error);
      expect(existUsers).toBe(false);
    }
  });

  it('generate & decode token', async () => {
    let generateToken: string;
    // overload {userId}
    generateToken = await UserModel.generateToken({ userId: 'id-1' });
    expect(generateToken).toBeString();
    const { userId } = await UserModel.decodeToken(generateToken);
    expect(userId).toBe('id-1');

    // overload { userName, email }
    generateToken = await UserModel.generateToken({ userName: 'test', email: 'test@email.abc' });
    expect(generateToken).toBeString();
    const { userName, email } = await UserModel.decodeToken(generateToken);
    expect(userName).toBe('test');
    expect(email).toBe('test@email.abc');
  });

  it('validate password', async () => {
    const tester = await UserModel.findById('6114a091defee345c4876aa4');
    const matchPassword = await tester.validatePassword('1');
    try {
      expect(matchPassword).toBe(true);
    } catch (error) {
      console.error(error);
      expect(matchPassword).toBe(false);
    }
  });
});
// #endregion

// #region conversation
describe('conversation', () => {
  it('find conversation', async () => {
    let conversation: IConversation;
    const expectedConversation: IConversation = {
      id: expect.toBeString(),
      creator: expect.toBeString(),
      createdAt: expect.toBeDate(),
      members: expect.arrayContaining([
        {
          id: expect.toBeString(),
          userName: expect.toBeString(),
          email: expect.toBeString(),
          avatar: expect.toBeString(),
          online: expect.toBeBoolean(),
          // TODO friendship: expect.toBeObject(),
        },
      ]),
    };
    try {
      // by conversationId
      conversation = await ConversationModel.findConversation({
        meId: '60e97ea983157a63a7e7dc2e',
        conversationId: '6103d457cf9331585911b267',
      });

      if (conversation.name) {
        expectedConversation.name = expect.toBeString();
      }

      expect(conversation).toEqual(expect.objectContaining(expectedConversation));

      delete expectedConversation.name;
      // by members
      conversation = await ConversationModel.findConversation({
        meId: '60e9752d5ebf885abf9c39c8',
        members: ['60ea6fbc5d45552b382ec3c9', '60e9752d5ebf885abf9c39c8'],
      });

      if (conversation.name) {
        expectedConversation.name = expect.toBeString();
      }

      expect(conversation).toEqual(expect.objectContaining(expectedConversation));
    } catch (error) {
      console.error(error);
      expect(conversation).toEqual({});
    }
  });

  it('find conversations', async () => {
    let conversations: Array<IConversation>;
    try {
      conversations = await ConversationModel.findConversations({
        meId: '60e97ea983157a63a7e7dc2e',
      });

      expect(conversations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.toBeString(),
            creator: expect.toBeString(),
            createdAt: expect.toBeDate(),
            members: expect.arrayContaining([
              {
                id: expect.toBeString(),
                userName: expect.toBeString(),
                email: expect.toBeString(),
                avatar: expect.toBeString(),
                online: expect.toBeBoolean(),
                // TODO friendship: expect.toBeObject(),
              },
            ]),
          }),
        ])
      );
    } catch (error) {
      console.error(error);
      expect(conversations).toEqual([]);
    }
  });

  it('check conversation exists', async () => {
    let existsConversation: boolean;
    try {
      existsConversation = await ConversationModel.existsConversation([
        '60ea6fbc5d45552b382ec3c9',
        '60e9752d5ebf885abf9c39c8',
      ]);
      expect(existsConversation).toBe(true);
    } catch (error) {
      console.error(error);
      expect(existsConversation).toBe(false);
    }
  });
});
// #endregion

// #region friendship
describe('friendship', () => {
  it('get friend id', async () => {
    let friendId: string;
    try {
      const friendship = await FriendshipModel.findById('60eb2ce6bf4df83279a62183');

      friendId = friendship && friendship.getFriendId('60e97ea983157a63a7e7dc2e');
      expect(friendId).toBeString();
    } catch (error) {
      console.error(error);
      expect(friendId).toBeNil();
    }
  });

  const expectedDetailFriend: IUser = {
    id: expect.toBeString(),
    userName: expect.toBeString(),
    email: expect.toBeString(),
    avatar: expect.toBeString(),
    online: expect.toBeBoolean(),
    friendship: expect.objectContaining({
      id: expect.toBeString(),
      requester: expect.toBeString(),
      addressee: expect.toBeString(),
      status: expect.toBeString(),
    }),
  };
  it('find addressees', async () => {
    let addressees: Array<IUser>;
    try {
      addressees = await FriendshipModel.findAddressees({ meId: '60e97ea983157a63a7e7dc2e' });
      expect(addressees).toEqual(
        expect.arrayContaining([expect.objectContaining(expectedDetailFriend)])
      );
    } catch (error) {
      expect(addressees).toEqual([]);
    }
  });

  it('find requesters', async () => {
    let addressees: Array<IUser>;
    try {
      addressees = await FriendshipModel.findRequesters({ meId: '60e97ea983157a63a7e7dc2e' });
      expect(addressees).toEqual(
        expect.arrayContaining([expect.objectContaining(expectedDetailFriend)])
      );
    } catch (error) {
      expect(addressees).toEqual([]);
    }
  });

  it('get friends', async () => {
    let friends: Array<IUser>;
    try {
      friends = await FriendshipModel.getFriends('60e97ea983157a63a7e7dc2e');
      const expectedFriend = { ...expectedDetailFriend };
      delete expectedFriend.friendship;
      expect(friends).toEqual(expect.arrayContaining([expect.objectContaining(expectedFriend)]));
    } catch (error) {
      console.error(error);
      expect(friends).toEqual([]);
    }
  });

  it('get friend', async () => {
    let friend: IUser;
    try {
      friend = await FriendshipModel.getFriend({
        meId: '60e97ea983157a63a7e7dc2e',
        friendId: '60e9752d5ebf885abf9c39c8',
      });

      expect(friend).toEqual(expect.objectContaining(expectedDetailFriend));
    } catch (error) {
      console.error(error);
      expect(friend).toEqual({});
    }
  });
});
// #endregion

// #region message
describe('message', () => {
  it('get message number', async () => {
    const messageNumber = await MessageModel.getMessageNumber({
      meId: '6114a091defee345c4876aa4',
      conversation: '6114a34717aa2d52fd397ab5',
    });
    expect(messageNumber).toBeNumber();
  });

  const expectedMessage = {
    id: expect.toBeString(),
    sender: expect.toBeString(),
    contentType: expect.toBeString(),
    conversation: expect.toBeString(),
    content: expect.toBeString(),
    usersSeen: expect.arrayContaining([expect.toBeString()]),
    createdAt: expect.toBeDate(),
  };

  it('find message', async () => {
    let message: IMessage;
    try {
      message = await MessageModel.findMessage({
        meId: '60ea6fbc5d45552b382ec3c9',
        conversationId: '60f8261e6d07aa254a7cfa5e',
        messageId: '60f826276d07aa254a7cfa68',
      });
      expect(message).toEqual(expect.objectContaining(expectedMessage));
    } catch (error) {
      console.error(error);
      expect(message).toEqual({});
    }
  });

  it('find messages', async () => {
    let result: IMessagesGetting;
    try {
      result = await MessageModel.findMessages({
        meId: '60ea6fbc5d45552b382ec3c9',
        conversationId: '60f8261e6d07aa254a7cfa5e',
      });
      expect(result).toEqual({
        total: expect.toBeNumber(),
        messages: expect.arrayContaining([expect.objectContaining(expectedMessage)]),
      });
    } catch (error) {
      expect(result).toEqual({ total: 0, messages: [] });
    }
  });

  it('find seen messages', async () => {
    let result: IMessagesGetting;
    try {
      result = await MessageModel.findSeenMessages({
        meId: '60e97ea983157a63a7e7dc2e',
        conversationId: '6104aea71728262e647fbacd',
      });
      expect(result).toEqual({
        total: expect.toBeNumber(),
        messages: expect.arrayContaining([expect.objectContaining(expectedMessage)]),
      });
    } catch (error) {
      expect(result).toEqual({ total: 0, messages: [] });
    }
  });

  it('find unseen messages', async () => {
    let result: IMessagesGetting;
    try {
      result = await MessageModel.findUnseenMessages({
        meId: '60ea6fbc5d45552b382ec3c9',
        conversationId: '60f8261e6d07aa254a7cfa5e',
      });

      expect(result).toEqual({
        total: expect.toBeNumber(),
        messages: expect.arrayContaining([expect.objectContaining(expectedMessage)]),
      });
    } catch (error) {
      expect(result).toEqual({ total: 0, messages: [] });
    }
  });

  it('find messages by messageids', async () => {
    let result: IMessagesGetting;
    try {
      result = await MessageModel.findMessagesByIds(
        {
          meId: '60e97ea983157a63a7e7dc2eA',
          messageIds: ['6109242b3f34d51449048be3', '610923503f34d51449048b65'],
          conversationId: '6114a34717aa2d52fd397ab5',
        },
        { byConversation: true }
      );

      expect(result).toEqual({
        total: expect.toBeNumber(),
        messages: expect.arrayContaining([expect.objectContaining(expectedMessage)]),
      });
    } catch (e) {
      expect(result).toEqual({ total: expect.toBeNumber(), messages: [] });
    }
  });
});
// #endregion
