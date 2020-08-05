const MaintenanceRepairRpModel = require('../../models/MaintenanceRepairRp')
const ColorCodeGeneratorService = require('./ColorCodeGeneratorService')
const mongoose = require('mongoose')

const {CONSTANT} = require("../../helpers")

const default_factory = CONSTANT.FACTORIES.F1

const findOrCreate = async (name,factory) => {
    try{
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase()
        let already_exisit = await MaintenanceRepairRpModel.findOne({factory,slug});
        if(already_exisit) return already_exisit;

        let new_stop_reason = new MaintenanceRepairRpModel({factory,slug,name,color_code:ColorCodeGeneratorService.getRandomColor()});
        let stop_reason = await new_stop_reason.save()

        return stop_reason;
    }catch(err){
        throw Error(err.message)
    }
}

const getValidRpIDs = async (payload) => {
    try{
        let {rps,factory} = payload
        let new_rps = rps.filter(async id=>{
            // valid each rp id
            let do_exist = await MaintenanceRepairRpModel.findById(mongoose.Types.ObjectId(id));
            if(do_exist) return id
        })
        
       return new_rps
    }catch(err){
        throw Error(err.message)
    }
}

const findOne = async (slug,factory) => {
    try{
        let do_exist = await MaintenanceRepairRpModel.findOne({factory,slug});
        if(!do_exist) throw Error("Maintenance Repair RP supplied is invalid")

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
        let machines = await MaintenanceRepairRpModel.aggregate([
            {
                $match:{
                    factory
                }
            },
            {
                $project:{
                  id:"$slug",
                  name:"$name",
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
    getValidRpIDs,
    getList
}