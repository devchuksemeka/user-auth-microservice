const JWT_Verify = require('../middlewares/jwt');

// const validation_schemas = require("../helpers/schemas");

const AuthController = require("../controllers/AuthController");
const authController = new AuthController()

// const {
//     validator:validate,
//     reqQueryValidator
// } = require("../helpers/validator");


module.exports = app => {

    const base_previx = `/auth`

    app.get(
        `${base_previx}/login`,
        // reqQueryValidator(validation_schemas.defaultOverviewScheman), 
        authController.login
    );

};
