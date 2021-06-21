export default class Error {
    static requestFriend = () => ({
      name: 'REQUEST_FRIEND',
      msg: 'Sent request friend or you became friends',
    });
    static getRequestFriend = () => ({
      name: 'GET_REQUEST_FRIEND',
      msg: 'Request friend not exist',
    });
    static getFriends = () => ({
      name: 'GET_FRIENDS',
      msg: 'Params is wrong',
    });
    static createExistRoom = () => ({
      name: 'CREATE_ROOM',
      msg: 'Room is exist',
    });
    static createLessThreeMembersRoom = () => ({
      name: 'CREATE_ROOM',
      msg: 'Members must be greater than three',
    });
}
