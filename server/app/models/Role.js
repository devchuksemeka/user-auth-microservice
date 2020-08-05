const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const schema = new Schema({
        name:{
            type:String,
            unique:true,
            required:true
        },
        permissions:[
            { 
                type: Schema.Types.ObjectId, 
                ref: 'Permission' 
            }
        ],
        notification_categories:[
            { 
                type: Schema.Types.ObjectId, 
                ref: 'NotificationCategory' 
            }
        ]
    },
    {
        timestamps:true
    }
);

module.exports = mongoose.model("Role",schema);