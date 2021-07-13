export default class Friend {
  constructor(user = {}) {
    // eslint-disable-next-line no-underscore-dangle
    this.id = user._id;
    this.userName = user.userName;
    this.email = user.email;
    this.avatar = user.avatar;
    this.online = user.online;
  }
}
