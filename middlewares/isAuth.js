const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    return res.status(400).json("session expired! please login");
  }
};
module.exports = isAuth;
