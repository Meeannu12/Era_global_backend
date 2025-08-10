const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access Denied, No Token Found",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.clearCookie("authToken");
      return res.status(401).json({
        success: false,
        message: "Token Expired, Please Login Again",
      });
    }
    console.error("Error verifying token:", error);
    return res.status(401).json({
      success: false,
      message: "Access Denied, Invalid Token",
    });
  }
}

module.exports = authenticateToken;
