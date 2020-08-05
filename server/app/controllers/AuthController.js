class AuthController{
    
    /**
     * Endpoint use to login users
     * @param {*} req 
     * @param {*} res 
     */

    async login(req,res){
        return res.json({
            name:"Miracle"
        })
    }
}

module.exports = AuthController