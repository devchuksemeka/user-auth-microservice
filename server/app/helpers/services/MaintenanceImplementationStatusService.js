const MaintenanceImplementationStatusModel = require('../../models/MaintenanceImplementationStatus')
const ColorCodeGeneratorService = require('./ColorCodeGeneratorService')

const {CONSTANT} = require("../../helpers")

const default_factory = CONSTANT.FACTORIES.F1

const findOrCreate = async (name,factory) => {
    try{
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase();
        let already_exisit = await MaintenanceImplementationStatusModel.findOne({factory,slug});
        if(already_exisit) return already_exisit;

        let new_stop_reason = new MaintenanceImplementationStatusModel({factory,slug,name,color_code:ColorCodeGeneratorService.getRandomColor()});
        let stop_reason = await new_stop_reason.save()

        return stop_reason;
    }catch(err){
        throw Error(err.message)
    }
}

const findOne = async (slug,factory) => {
    try{
        if(!factory){
            factory = default_factory
        }
        let do_exist = await MaintenanceImplementationStatusModel.findOne({factory,slug});
        if(!do_exist) throw Error("Maintenance Implementation Status supplied is invalid")

        return do_exist;
    }catch(err){
        throw Error(err.message)
    }
}

const getList = async (factory) => {
    try{
        if(!factory){
            factory = default_factory
        }
        let machines = await MaintenanceImplementationStatusModel.aggregate([
            {
                $match:{
                    factory
                }
            },
            {
                $project:{
                  id:"$slug",
                  name:"$name",
                  _id:0
                }
            },{
                $sort:{
                    name:1
                }
            }
        ]);

        return machines
    }catch(err){
        throw Error(err.message)
    }
}

module.exports = {
    findOrCreate,
    findOne,
    getList
}