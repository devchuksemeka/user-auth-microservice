var jwt = require('jsonwebtoken');

var JWT = {};

JWT.verifyToken = function(req, res, next) {

    let token = req.body.token || req.query.token || req.headers['authorization'] || "";
    let tokenSplit = token.split(" ");
    token = tokenSplit[1]
    if (tokenSplit[0] !== "Bearer") {
        return res.status(401).json({ status: false, message: 'Invalid authorization token: Must be Bearer format'});
    }
    else if (!token) {
        return res.status(401).json({ status: false, message: 'No token provided'});
    }
    
    jwt.verify(token, process.env.JWT_SECRET_KEY, verifyCallBack);

    function verifyCallBack(error, decoded) {
        if (error) {
            return res.status(401).json({status:false, message: error.message});
        }
        res.decoded = decoded;
        req.user_detail = decoded.userDetails
        // console.log(decoded.userDetails)
        next();
    }
};

module.exports = JWT;