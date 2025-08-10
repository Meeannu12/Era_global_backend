const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: 7 * 24 * 60 * 60 * 1000,
  });
};

const setTokenCookie = (res, token) => {
  return res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

module.exports = {
  generateToken,
  setTokenCookie,
};
