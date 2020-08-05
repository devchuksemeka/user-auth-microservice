const MachineStopReasonModel = require('../../models/MachineStopReason')
const ColorCodeGeneratorService = require('./ColorCodeGeneratorService')

const {CONSTANT} = require("../../helpers")

const default_factory = CONSTANT.FACTORIES.F1

const findOrCreateStopReason = async (name,factory) => {
    try{
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase();
        let already_exisit = await MachineStopReasonModel.findOne({factory,slug});
        if(already_exisit) return already_exisit;

        let new_stop_reason = new MachineStopReasonModel({factory,slug,name,color_code:ColorCodeGeneratorService.getRandomColor()});
        let stop_reason = await new_stop_reason.save()

        return stop_reason;
    }catch(err){
        throw Error(err.message)
    }
}

const create = async (payload) => {
    try{
        let {factory,name,color_code} = payload
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase();
        let already_exisit = await MachineStopReasonModel.findOne({factory,slug});
        if(already_exisit) throw Error("Type with same slug name already exist")

        let new_stop_reason = new MachineStopReasonModel({factory,slug,name,color_code});
        let stop_reason = await new_stop_reason.save()

        return stop_reason;
    }catch(err){
        throw Error(err.message)
    }
}

const removeOne = async (name_or_slug,factory) => {
    try{
        if(!factory){
            factory = default_factory
        }
        let slug = name_or_slug.replace(/\s/g,"_");
        slug = slug.toLowerCase();
        await MachineStopReasonModel.findOneAndDelete({slug,factory});
        
        return {message:"Deleted"}
    }catch(err){
        throw Error(err.message)
    }
}

const getMachineStopReasonList = async (factory) => {
    try{
        let machines = await MachineStopReasonModel.aggregate([
            {
                $match:{
                    factory,
                    slug:{
                        $ne:"end_of_shift"
                    }
                }
            },
            {
                $project:{
                  id:"$slug",
                  name:"$name",
                  factory:"$factory",
                  color:"$color_code",
                //   _id:1
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

const findOne = async (slug,factory) => {
    try{
        slug = slug.toLowerCase();
        let do_exist = await MachineStopReasonModel.findOne({slug,factory});
        if(!do_exist) throw Error("Machine Stop Reason supplied is invalid")

        return do_exist;
    }catch(err){
        throw Error(err.message)
    }
}


const getEndOfShiftID = async (factory) =>{
    if(!factory){
        factory = default_factory
    }

    let end_of_shift = await findOne("end_of_shift",factory);
    return end_of_shift._id
}

module.exports = {
    findOrCreateStopReason,
    create,
    findOne,
    removeOne,
    getMachineStopReasonList,
    getEndOfShiftID
}