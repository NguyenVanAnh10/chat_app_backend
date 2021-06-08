export const postLogout = (req, res) => {
  res.cookie("token_user", "", { maxAge: Date.now() });
  res.json({});
};
