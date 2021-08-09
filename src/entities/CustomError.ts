interface CustmError {
  name: string;
  message: string;
  code?: number;
}

export default class CustomError extends Error {
  constructor(error: CustmError) {
    super(error.message);
    this.name = error.name;
  }
}

export const Errors = {
  ACCESS_DENIED: {
    name: 'ACCESS_DENIED',
    message: 'Access denied',
  },
  MESSAGE_NO_EXISTS: {
    name: 'MESSAGE_NO_EXISTS',
    message: "The message doesn't exist",
  },
  FRIENDSHIP_UPDATED: {
    name: 'FRIENDSHIP_UPDATED',
    message: 'Friendship was updated',
  },
  FRIENDSHIP_NO_EXIST: {
    name: 'FRIENDSHIP_NO_EXIST',
    message: "Friendship doesn't exist",
  },
  FRIENDSHIP_ALREADY_EXISTS: {
    name: 'FRIENDSHIP_ALREADY_EXISTS',
    message: 'Friendship already exists',
  },
  NO_PARAMS: {
    name: 'NO_PARAMS',
    message: 'Miss or no parameters',
  },
  REQUEST_FRIEND: {
    name: 'REQUEST_FRIEND',
    message: 'Sent request friend or you became friends',
  },
  GET_REQUEST_FRIEND: {
    name: 'GET_REQUEST_FRIEND',
    message: 'Request friend not exist',
  },
  GET_FRIENDS: {
    name: 'GET_FRIENDS',
    message: 'Params is wrong',
  },
  CONVERSATION_ALREADY_EXISTS: {
    name: 'CONVERSATION_ALREADY_EXISTS',
    message: 'Conversation already exists',
  },
  CONVERSATION_NOT_FOUND: {
    name: 'CONVERSATION_NOT_FOUND',
    message: 'Conversation not found',
  },
  GROUP_MEMBER_NUMBER: {
    name: 'GROUP_MEMBER_NUMBER',
    message: 'Members must be greater than three',
  },
  INVALID_TOKEN: {
    name: 'INVALID_TOKEN',
    message: 'Invalid or expired token',
  },
  GET_ACCOUNT: {
    name: 'GET_ACCOUNT',
    message: 'Account does not exist',
  },
  PASSWORD_IS_WRONG: {
    name: 'PASSWORD_IS_WRONG',
    message: 'Password is wrong',
  },
  ACCOUNT_ALREADY_EXISTS: {
    name: 'ACCOUNT_ALREADY_EXISTS',
    message: 'Account already exists',
  },
  ACCOUNT_ALREADY_REGISTERS: {
    name: 'ACCOUNT_ALREADY_REGISTERS',
    message: 'The account has already registered',
  },
  INVALIDATE_ACCOUNT: {
    name: 'INVALIDATE_ACCOUNT',
    message: 'Invalidate Account',
  },
  USER_NOT_FOUND: {
    name: 'USER_NOT_FOUND',
    message: 'User not found',
  },
};
