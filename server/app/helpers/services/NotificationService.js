const UserModel = require("../../models/user")
const RoleModel = require("../../models/Role")
const NotificationModel = require("../../models/Notification")
const NotificationCategory = require("../../models/NotificationCategory")


const DAILY_REPORT = "Daily Report"
const PRODUCTION_TARGET = "Production Target"
const SUPPLY_TARGET = "Supply Target"
const EX_SERVICE_TARGET = "Expeller Service Due Target"
const EX_OVERHAUL_TARGET = "Expeller Overhaul Due Target"

const NOTIFICATION_SETTINGS = [
    PRODUCTION_TARGET,
    SUPPLY_TARGET,
    EX_SERVICE_TARGET,
    EX_OVERHAUL_TARGET,
    DAILY_REPORT
]

const DEVELOPER_SETTINGS = [
    ...NOTIFICATION_SETTINGS
]

const SUPER_ADMIN_SETTINGS = [
    ...NOTIFICATION_SETTINGS
]

const ADMIN_SETTINGS = [
    ...NOTIFICATION_SETTINGS
]

const FACTORY_MANAGER_SETTINGS = [
    ...NOTIFICATION_SETTINGS
]

const METRICS_LEAD_SETTINGS = [
    PRODUCTION_TARGET,
    SUPPLY_TARGET,
]

const CITIZEN_SETTINGS = []

const TROOPER_SETTINGS = []

const ASSESSMENT_ACCT_SETTINGS = []

const pushNotificationToUser = async (user_id) =>{
    try{
        let user = await UserModel.findById(user_id);
        if(!user) throw Error("User not found")

        // check if user have role
        if(!user.role) throw Error("User does not have a role attach to account")

        // check if role is valid
        let role = await RoleModel.findById(user.role);
        if(!role) throw Error("No Role with user role specified found")

        // get the notification setting for user group
        let notification_ids = role.notification_categories
        if(!notification_ids) throw Error("No Notification available for Role")
        if(notification_ids.length < 1) throw Error("No Notification available for Role")

        // create notification setting for user
        user.notification_settings = await setupNotification(notification_ids)
        await user.save()


        return {
            status:true,
            message:"User setting setup successfully"
        }

    }catch(err){
        return {
            status:false,
            message:err.message
        }
    }
    
}

const setNotificationCategoriesToRole = async (role_name,notification_categories_array) => {
    try{
        let role_exist = await RoleModel.findOne({name:role_name});
        if(role_exist) {

            // add categories to it
            let notification_categories = await NotificationCategory.aggregate([
                {
                    $match:{
                        slug:{$in:notification_categories_array.map(category=>{
                                let cate = category.toLowerCase();
                                return cate.replace(/\s/g,"_")
                            }
                        )}
                    }
                },
                {
                    $project:{
                        _id:1
                    }
                }
            ]);

            notification_categories_ids = notification_categories.map(notice=>{
                return notice._id;
            })

            role_exist.notification_categories.push(...notification_categories_ids)
            let notification_categories_list = role_exist.notification_categories
            const unique = (value, index, self) => {
                return self.indexOf(value) === index
            }
              
            role_exist.notification_categories = notification_categories_list.filter(unique)
            await role_exist.save();
        }else{
            console.log(`Role with name: ${role_name}  does not exist`)
        }
    }catch(err){
       console.error(err.message)
    }
}

const createNotificationsCategoryAndSetForRoleSeeder = async () => {

    // first thing try creating notification categories
    NOTIFICATION_SETTINGS.map(async notification=>{
        console.log("notification_setting",notification)
        let name = notification
        let slug = name.toLowerCase();
        slug = slug.replace(/\s/g,"_")
        try{
            let already_exist = await NotificationCategory.findOne({slug});
            if(!already_exist) {
                let creating = await new NotificationCategory({name,slug});
                let notification = await creating.save();
            }else{
                // console.log("already_exist",already_exist)
            }
        }catch(err){
           console.error(err.message)
        }
    })

    // add notification categories to roles

    // DEVELOPER
    await setNotificationCategoriesToRole("DEVELOPER",DEVELOPER_SETTINGS)

    // SUPER_ADMIN
    await setNotificationCategoriesToRole("SUPER_ADMIN",SUPER_ADMIN_SETTINGS)

    // ADMIN
    await setNotificationCategoriesToRole("ADMIN",ADMIN_SETTINGS)

    // FACTORY_MANAGER
    await setNotificationCategoriesToRole("FACTORY_MANAGER",FACTORY_MANAGER_SETTINGS)

    // METRICS
    await setNotificationCategoriesToRole("METRICS_LEAD",METRICS_LEAD_SETTINGS)

    // CITIZEN
    await setNotificationCategoriesToRole("CITIZEN",CITIZEN_SETTINGS)

    // TROOPER
    await setNotificationCategoriesToRole("TROOPER",TROOPER_SETTINGS)

    // ASSESSMENT_ACCT
    await setNotificationCategoriesToRole("ASSESSMENT_ACCT",ASSESSMENT_ACCT_SETTINGS)

}

const setupNotification = async (role_notification_ids) =>{
    // get the list of notifications from notification categories
    console.log(role_notification_ids)
    let notifications_categories = await NotificationCategory.aggregate([
        {
            $match:{
                _id:{$in:role_notification_ids}
            }
        }
        
    ])

    return notifications_categories.map(notification => {
        return {
            ...notification,
            receiving_channels:{
                push:{
                    name:"Push",
                    description:"Description on how push works",
                    is_enabled:true
                },
                email:{
                    name:"Email",
                    description:"Description on how email works",
                    is_enabled:true
                },
                sms:{
                    name:"SMS",
                    description:"Description on how SMS works",
                    is_enabled:false
                },
            }
        }
    })
}

const seederUsersNotificationSettings = async () => {
  try{
      // get users list
      let users = await UserModel.find();
      users.map(async user =>{
          // check if user have role
        if(user.role){
            // check if role is valid
            let role = await RoleModel.findById(user.role);
            if(role) {
                 // get the notification setting for user group
                let notification_ids = role.notification_categories
                if(notification_ids && notification_ids.length > 0) {
                    // create notification setting for user
                    let current_user_settings = user.notification_settings;
                    let current_user_settings_ids = current_user_settings.map(set => set._id)

                    let set_up_settings = await setupNotification(notification_ids);
                    let new_settings = set_up_settings.filter(setting => {
                        if(!current_user_settings_ids.includes(setting._id)) return setting;
                    })
                    
                    // let new_current_setting = current_user_settings 
                    user.notification_settings.push(...new_settings) 
                    await user.save()
                }else{
                    console.log("notification_ids cannot be empty of undefine")
                }
            }else{
                console.log("invalid role for user")
            }
        }else{
            console.log("Role is empty")
        }
      })
      return {
          status:true,
          data:users
      }

  }catch(err){
    return {
        status:false,
        message:err.message
    }
  }
}

const getSingleNotificationCategory = async (search_object) => {
    return await NotificationCategory.findOne(search_object);
}

// get all roles that have this notification_categories in them
const getRolesWithNotification = async (search_object) => {
    let notification_category = await getSingleNotificationCategory(search_object);
    return await RoleModel.aggregate([
        {
            $match:{
                notification_categories:{
                    $in:[notification_category._id]
                }
            }
        },
        {
            $project:{
                name:1
            }
        }
    ]);
    
}    

const getRolesIDForNotification = async (search_object) => {
    let roles_list = await getRolesWithNotification(search_object);
    return roles_list.map(role=>{
        return role._id;
    })
}  

const getUsersInRoles = async (roles_ids) => {
    return await UserModel.aggregate([
        {
            $match:{
                role:{
                    $in:roles_ids
                }
            }
        },
        {
            $project:{
                email:1
            }
        }
    ]);
}

const sendNotificationToAllUsers = async (search_object,payload) => {
    let role_ids = await getRolesIDForNotification(search_object);
    let users = await getUsersInRoles(role_ids);
    let notification_category = await getSingleNotificationCategory(search_object);

    // loop through users and create notifications
    users.forEach(user => {
        let new_notice = new NotificationModel({
            user:user._id,
            notification_category:notification_category._id,
            payload
        })
        new_notice.save()
    })
    return users
}
        // get all users that are due to receiving this type of notification base on group


module.exports = {
    pushNotificationToUser,
    sendNotificationToAllUsers,
    // getRolesWithNotification,
    // getRolesIDForNotification,
    createNotificationsCategoryAndSetForRoleSeeder,
    seederUsersNotificationSettings
}