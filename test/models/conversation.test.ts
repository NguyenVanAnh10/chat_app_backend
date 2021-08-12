import initDatabase from 'models';
import ConversationModel from 'models/Conversation';

let db;
beforeAll(() => {
  db = initDatabase();
});

afterAll(() => {
  db?.close();
});

it('find conversations for user', async () => {
  expect.assertions(1);
  try {
    const conversation = await ConversationModel.findConversations({ meId: 'asdf' });
    expect(conversation).toEqual([]);
  } catch (error) {
    expect(error).toMatch('error');
  }
});
