const SettingModel = require('../../models/Setting')

const getSingleNotification = async (search_object) => {
    try{
        return await SettingModel.findOne(search_object);
    }catch(err){
        throw Error(err.message)
    }
}

const targetComputation = async (comparing_value,target_object) => {
    let setting = await SettingModel.findOne(target_object)
    let determinant_var = 0;
    // console.log("settings",setting)
  
    // let status ="below";
    let status = target_object.type === "production_target" && target_object.name === "downtime" ? "above": "below";
    if(setting){
      determinant_var = parseFloat(setting.value) || 0
    }
  
    if(comparing_value > determinant_var){
      // status= "above"
      status= target_object.type === "production_target" && target_object.name === "downtime" ? "below": "above"
    }
  
    // compute percentage
    let percentage = Math.abs(comparing_value - determinant_var);
    // let percentage = ((Math.abs(comparing_value - determinant_var))/determinant_var) * 100;
    percentage = parseFloat(percentage.toFixed(2));
  
    return {percentage,status,determinant_var}
  }

module.exports = {
    getSingleNotification,
    targetComputation
}