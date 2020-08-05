const MaintenanceActionModel = require('../../models/MaintenanceAction')
const mongoose = require("mongoose")
const ColorCodeGeneratorService = require('./ColorCodeGeneratorService')

const {CONSTANT} = require("../../helpers")

const default_factory = CONSTANT.FACTORIES.F1

const findOrCreate = async (name,factory) => {
    try{
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase()
        let already_exisit = await MaintenanceActionModel.findOne({factory,slug});
        if(already_exisit) return already_exisit;

        let new_stop_reason = new MaintenanceActionModel({factory,slug,name,color_code:ColorCodeGeneratorService.getRandomColor()});
        let stop_reason = await new_stop_reason.save()

        return stop_reason;
    }catch(err){
        throw Error(err.message)
    }
}

const create = async (payload) => {
    try{
        let {factory,name,component_id} = payload
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase();

        let color_code = ColorCodeGeneratorService.getRandomColor()
        let already_exisit = await MaintenanceActionModel.findOne({factory,slug});
        if(already_exisit) throw Error("Type with same slug name already exist")

        let new_stop_reason = new MaintenanceActionModel({factory,slug,name,color_code});
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
        let do_exist = await MaintenanceActionModel.findOne({factory,slug});
        if(!do_exist) throw Error("Maintenance Action supplied is invalid")

        return do_exist;
    }catch(err){
        throw Error(err.message)
    }
}

const getList = async (slug,factory) => {
   
    try{
        
        if(!factory){
            factory = default_factory
        }
       let machines = [];
        if(slug) {
            slug = slug.replace(/\s/g,"_");
            slug = slug.toLowerCase()
    
            machines = await MaintenanceActionModel.aggregate([
                {
                    $match:{
                        slug,
                        factory
                    }
                },
                {
                    $project:{
                      id:"$slug",
                      name:"$name",
                      factory:"$factory",
                      color:"$color_code",
                      _id:0
                    }
                },{
                    $sort:{
                        name:1
                    }
                }
            ]);
        }else{
            machines = await MaintenanceActionModel.aggregate([
                {
                    $match:{
                        factory
                    }
                },
                {
                    $project:{
                      id:"$slug",
                      name:"$name",
                      color:"$color_code",
                      factory:"$factory",
                      _id:0
                    }
                },{
                    $sort:{
                        name:1
                    }
                }
            ]);
        }
        

        return machines
    }catch(err){
        throw Error(err.message)
    }
}

const getMaintenanceActionsList = async (payload) => {
   
    try{
        let  {slug,factory,component} = payload
        console.log(payload)
        let match = {
            factory
        }

        if(component){
            match = {
                ...match,
                components:{
                    $in:[
                        mongoose.Types.ObjectId(component)
                    ]
                }
               
            }
        }
        
       let machines = await MaintenanceActionModel.aggregate([
            {
                $match:match
            },
            {
                $project:{
                    id:"$slug",
                    name:"$name",
                    color:"$color_code",
                    factory:"$factory",
                    components:"$components",
                    _id:0
                }
            },
            {
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
    create,
    findOne,
    getList,
    getMaintenanceActionsList
}