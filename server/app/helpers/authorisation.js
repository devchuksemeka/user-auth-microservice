const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next, token) => {
  jwt.verify(token, process.env.JWT_SECRET_KEY, (error, decoded) => {
    if (error) {
      return res.status(403).json({
        message: "Failed to authenticate token."
      });
    }
    req.user = decoded.userDetails;
    next();
  });
};

exports.hasValidToken = (req, res, next) => {
  const bearerAuth = req.headers["authorization"];
  if (bearerAuth) {
    const token = bearerAuth.split(" ")[1];
    return verifyToken(req, res, next, token);
  }
  return res.status(400).json({
    message: "No token provided."
  });
};

exports.isSuperUser = (req, res, next) => {
  if (req.user.role === 1) {
    next();
  } else {
    return res.status(401).json({
      message: "You are not authorised for this action"
    });
  }
};
