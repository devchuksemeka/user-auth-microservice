const MachineTypeModel = require('../../models/MachineType')
const ColorCodeGeneratorService = require('./ColorCodeGeneratorService')

const {CONSTANT} = require("../../helpers")

const default_factory = CONSTANT.FACTORIES.F1

const findOrCreateMachineType = async (name,factory) => {
    try{
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase();
        let already_exisit = await MachineTypeModel.findOne({slug,factory});
        if(already_exisit) return already_exisit;

        let new_stop_reason = new MachineTypeModel({factory,slug,name,color_code:ColorCodeGeneratorService.getRandomColor()});
        let stop_reason = await new_stop_reason.save()

        return stop_reason;
    }catch(err){
        throw Error(err.message)
    }
}


const create = async (payload) => {
    try{
        let {factory,name} = payload
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase();

        let color_code = ColorCodeGeneratorService.getRandomColor()
        let already_exisit = await MachineTypeModel.findOne({factory,slug});
        if(already_exisit) throw Error("Type with same slug name already exist")

        let new_stop_reason = new MachineTypeModel({factory,slug,name,color_code});
        let stop_reason = await new_stop_reason.save()

        return stop_reason;
    }catch(err){
        throw Error(err.message)
    }
}

const getMachineList = async (payload) => {
    try{
        let {factory,with_all_component} = payload
        if(!factory){
            factory = default_factory
        }

        let match = {
            factory,
        }

        if(!with_all_component){
            match = {
                ...match,
                slug:{
                    $ne:"all_components"
                }
            }
        }


        let machines = await MachineTypeModel.aggregate([
            {
                $match:match
            },
            {
                $project:{
                  id:"$slug",
                  name:"$name",
                  factory:"$factory",
                  color:"$color_code",
                //   _id:0
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
        if(!factory){
            factory = default_factory
        }
        let do_exist = await MachineTypeModel.findOne({slug,factory});
        if(!do_exist) throw Error("Machine Type supplied is invalid")

        return do_exist;
    }catch(err){
        throw Error(err.message)
    }
}

const getAllComponentsID = async (factory) =>{
    if(!factory){
        factory = default_factory
    }
    let all_components = await findOne("all_components",factory);
    return all_components._id
}
module.exports = {
    findOrCreateMachineType,
    create,
    findOne,
    getMachineList,
    getAllComponentsID
}