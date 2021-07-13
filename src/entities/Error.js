export default class Error {
  static get ACCESS_DENIED() {
    return {
      name: 'ACCESS_DENIED',
      message: 'Access denied',
    };
  }
  static get MESSAGE_NO_EXISTS() {
    return {
      name: 'MESSAGE_NO_EXISTS',
      message: "The message doesn't exist",
    };
  }
  static get FRIENDSHIP_UPDATED() {
    return {
      name: 'FRIENDSHIP_UPDATED',
      message: 'Friendship was updated',
    };
  }
  static get FRIENDSHIP_NO_EXIST() {
    return {
      name: 'FRIENDSHIP_NO_EXIST',
      message: "Friendship doesn't exist",
    };
  }
  static get FRIENDSHIP_ALREADY_EXISTS() {
    return {
      name: 'FRIENDSHIP_ALREADY_EXISTS',
      message: 'Friendship already exists',
    };
  }
  static get NO_PARAMS() {
    return {
      name: 'NO_PARAMS',
      message: 'Miss or no parameters',
    };
  }
  static get REQUEST_FRIEND() {
    return {
      name: 'REQUEST_FRIEND',
      message: 'Sent request friend or you became friends',
    };
  }
  static get GET_REQUEST_FRIEND() {
    return {
      name: 'GET_REQUEST_FRIEND',
      message: 'Request friend not exist',
    };
  }
  static get GET_FRIENDS() {
    return {
      name: 'GET_FRIENDS',
      message: 'Params is wrong',
    };
  }
  static get CONVERSATION_ALREADY_EXISTS() {
    return {
      name: 'CONVERSATION_ALREADY_EXISTS',
      message: 'Conversation already exists',
    };
  }
  static get CONVERSATION_NOT_FOUND() {
    return {
      name: 'CONVERSATION_NOT_FOUND',
      message: 'Conversation not found',
    };
  }
  static get GROUP_MEMBER_NUMBER() {
    return {
      name: 'GROUP_MEMBER_NUMBER',
      message: 'Members must be greater than three',
    };
  }
  static get INVALID_TOKEN() {
    return {
      name: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    };
  }
  static get GET_ACCOUNT() {
    return {
      name: 'GET_ACCOUNT',
      message: 'Account does not exist',
    };
  }
  static get PASSWORD_IS_WRONG() {
    return {
      name: 'PASSWORD_IS_WRONG',
      message: 'Password is wrong',
    };
  }
  static get ACCOUNT_ALREADY_EXISTS() {
    return {
      name: 'ACCOUNT_ALREADY_EXISTS',
      message: 'Account already exists',
    };
  }
  static get ACCOUNT_ALREADY_REGISTERS() {
    return {
      name: 'ACCOUNT_ALREADY_REGISTERS',
      message: 'The account has already registered',
    };
  }
  static get INVALIDATE_ACCOUNT() {
    return {
      name: 'INVALIDATE_ACCOUNT',
      message: 'Invalidate Account',
    };
  }
  static get USER_NOT_FOUND() {
    return {
      name: 'USER_NOT_FOUND',
      message: 'User not found',
    };
  }
}
