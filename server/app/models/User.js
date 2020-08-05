const mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  bcrypt = require("bcrypt-nodejs");

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true
    },
    phone: {
      type: String,
      unique: true
    },
    username: {
      type: String,
      unique: true
    },
    password: String,
    first_name:{
      type:String
    },
    last_name:{
      type:String
    },
    org_position:{
      type:String
    },
    city:{
      type:String
    },
    country:{
      type:String
    },
    approval_status:{
      type:String,
      enum:["APPROVED","PENDING","DISAPPROVED"],
      default:"PENDING"
    },
    notification_settings:{
      type:Array
    },
    role: {
      type: Schema.Types.ObjectId, 
      ref: 'Role' 
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

UserSchema.pre("save", function(next) {
  var user = this;

  if (!user.isModified("password")) return next();

  bcrypt.genSalt(process.env.SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);
    user.password = bcrypt.hashSync(user.password, salt);
    next();
  });
});

(UserSchema.methods.comparePassword = function(plainText) {
  return bcrypt.compareSync(plainText, this.password);
}),
  (module.exports = mongoose.model("User", UserSchema));
