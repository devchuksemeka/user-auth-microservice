const JWT_Verify = require('../middlewares/jwt');
const auth_route = require("./auth")

// const {validator:validate,reqQueryValidator} = require("../helpers/validator");

module.exports = app => {

  app.get("/healthz", (req, res) => {
    res.status(200).send({
      message: "healthy"
    });
  });

  auth_route(app)
};
