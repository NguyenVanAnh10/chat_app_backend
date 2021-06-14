const postLogout = (req, res) => {
  res.cookie('token_user', '', { maxAge: Date.now() });
  res.json({});
};
export default postLogout;
