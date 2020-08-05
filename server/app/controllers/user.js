const {CONSTANT} = require("../helpers");
const User = require("../models/user");
const Role = require("../models/Role");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose")

const getToken = user => {
  const secret = process.env.JWT_SECRET_KEY;
  const createToken = (user, expiryTime) =>
    jwt.sign(user, secret, { expiresIn: expiryTime });

  const userDetails = {
    email: user.email,
    id: user._id,
    role: user.role
  };
  const jsonToken = createToken({ userDetails }, "24000h");
  return jsonToken;
};

const create = async (req, res) => {
  let user_body = req.body;
  let role_v = await Role.aggregate([
    {
      $match:{
        name:"CITIZEN"
      }
    }
  ])

  user_body.role = role_v[0]._id;

  User.findOne({
    email: req.body.email
  })
  .then(existingUser => {
    if (!existingUser) {
      
      const user = new User(user_body);
      user.save(err => {
        if (err) {
          return res.status(500).send({ err });
        }
        return res
          .status(201)
          .json({status:true, message: "Account created successfully, kindly contact system Admin to approve your account" });
      });
    } else {
      return res
        .status(409)
        .send({ message: "An account with this email already exist" });
    }
  });
};

const update = async (req, res) => {
  let {user_uuid} = req.params;
  let user_body = req.body;
  try{
    const role = await Role.findById(mongoose.Types.ObjectId(user_body.role))
    if(!role) throw Error("Invalid Role supplied")
    const user = await User.findById(mongoose.Types.ObjectId(user_uuid))
    if(!user) throw Error("User not found")

    user.role = role._id
    user.first_name = user_body.first_name
    user.last_name = user_body.last_name
    user.email = user_body.email
    user.phone = user_body.phone

    await user.save()
    return res.json({status:true, message: "Account updated successfully" });

  }catch(err){
    return res.status(422).json({ message: err.message });
  }
};

const login = (req, res) => {
  User.findOne({email: req.body.email})
  .populate('role')
  .exec((err, user) => {
      if (err) return res.status(500).send({ err });
      if (!user) return res.status(404).send({ message: "email or password is incorrect" });
      if (!user.comparePassword(req.body.password)) return res.status(400).send({ message: "email or password is incorrect" });
      
      // check if account has been approved
      if(user.approval_status !== "APPROVED") return res.status(422).json({
        status:false,
        message:"Account has not been approved: Kindly contact the system admin"})
      if(!user.role) return res.status(422).json({
        status:false,
        message:"Role has not been Assigned to account: Kindly contact the system admin"})
        Role.findById(user.role._id)
        .populate("permissions")
        .exec((error,data)=>{
          if (error) return res.status(500).send({ error });
          let new_user = {...user._doc,role:undefined}
          let permissions = getPermissionsList(data.permissions)
          let role = user.role.name
          const token = getToken(new_user);
          return res.status(200).send({ message: "login successful" ,data:{
              ...new_user,
              password:undefined,
              permissions,
              role,
              token
            }
          });
        });
    }
  );
};

const getPermissionsList = (permissions_array_obj) =>{
  return permissions_array_obj.map(permission =>{
    return permission.name
  })
}

const getUserNotifications = async (req,res) => {
  let user_detail = req.user_detail;
  try{
    let user = await User.findById(user_detail.id);

    if(!user) throw Error("Invalid user supplied")

    return res.json({
      status:true,
      data:user.notification_settings
    })

  }catch(err){
    return res.status(422).json({
      status:false,
      message:err.message
    })
  }
}

const setRole = (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    console.log("body", req.body);
    if (err || !user) {
      return res.status(404).send({ message: "User not found", err });
    }
    user.role = req.body.role;
    user.save(err => {
      if (err) {
        return res.status(500).send({ err });
      }
      return res.status(200).send({ message: "users role updated successful" });
    });
  });
};

const updateAccountApprovalStatus = async (req, res) => {
  let user_id = req.params.user_uuid
  let user = await User.findById(user_id);
  if(!user) return res.status(404).json({status:false, message: "User not found" });

  if(user.role == 1 || user.role == 2){
    user.role = CONSTANT.USER_ROLES.ADMIN
  }
  // let update_user = user
  if(req.body.status === CONSTANT.USER_APPROVAL_STATUS.APPROVED){
    user.approval_status = CONSTANT.USER_APPROVAL_STATUS.APPROVED
  }

  if(req.body.status === CONSTANT.USER_APPROVAL_STATUS.DISAPPROVED){
    user.approval_status = CONSTANT.USER_APPROVAL_STATUS.DISAPPROVED
  }

  let update_user = await user.save()
  if(update_user) return res.json({status:true, message:"Account approval updated successfull" });
  return res.status(422).json({status:false, message:"Account approval update failed" });
};

const getUserProfile = (req,res) => {
  User.findById(mongoose.Types.ObjectId(req.params.user_uuid))
  .populate('role')
  .exec((err, user) => {
      if (err) return res.status(500).send({ err });
      Role.findById(user.role._id)
      .populate("permissions")
      .exec((error,data)=>{
        if (error) return res.status(500).send({ error });
        let new_user = {...user._doc,role:undefined}
        let permissions = getPermissionsList(data.permissions)
        const role_payload = user.role
        let role = role_payload.name
        return res.json({
          ...new_user,
          password:undefined,
          permissions,
          role,
          role_payload
        });
      });
    }
  );
}


const getUsers = async (req, res) => {
  try{
    let users = await User.aggregate([
      {
        $project:{
          email:1,
          role:1,
          created_at:1,
          approval_status:1,
          first_name:1,
          last_name:1,
        }
      },
      {
        $lookup:{
            from:"roles",
            as:"role_docs",
            localField:"role",
            foreignField:"_id",
        }
      },
      {
        $project:{
          role_doc:{
            $arrayElemAt:["$role_docs",0]
          },
          email:1,
          role:1,
          created_at:1,
          approval_status:1,
          first_name:1,
          last_name:1,
        }
      },
      {
        $project:{
          email:1,
          role:"$role_doc.name",
          role_payload:"$role_doc",
          created_at:1,
          approval_status:1,
          first_name:1,
          last_name:1,
        }
      },
      {
        $sort:{
          created_at:-1
        }
      }
    ])
    return res.json({status:true,data:users})
  }catch(err){
    return res.status(422).json({status:true,error:err})
  }
  
};

module.exports = {
  setRole,
  login,
  create,
  update,
  getUsers,
  getUserProfile,
  updateAccountApprovalStatus,
  getUserNotifications
}
