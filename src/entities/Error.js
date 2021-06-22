export default class Error {
    static requestFriend = () => ({
      name: 'REQUEST_FRIEND',
      message: 'Sent request friend or you became friends',
    });
    static getRequestFriend = () => ({
      name: 'GET_REQUEST_FRIEND',
      message: 'Request friend not exist',
    });
    static getFriends = () => ({
      name: 'GET_FRIENDS',
      message: 'Params is wrong',
    });
    static createExistRoom = () => ({
      name: 'CREATE_ROOM',
      message: 'Room already exists',
    });
    static createLessThreeMembersRoom = () => ({
      name: 'CREATE_ROOM',
      message: 'Members must be greater than three',
    });
    static invalidToken = () => ({
      name: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
    static getAccount = () => ({
      name: 'GET_ACCOUNT',
      message: 'Account does not exist',
    });
    static getPassword = () => ({
      name: 'GET_PASSWORD',
      message: 'Password is wrong',
    });
    static createAccount = () => ({
      name: 'CREATE_ACCOUNT',
      message: 'Account already exists',
    });
    static invalidateAccount = () => ({
      name: 'INVALIDATE_ACCOUNT',
      message: 'Invalidate Account',
    });
}
