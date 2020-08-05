const SubComponentType = require('../../models/SubComponentType')
const ColorCodeGeneratorService = require('./ColorCodeGeneratorService')

const {CONSTANT} = require("../../helpers")

const default_factory = CONSTANT.FACTORIES.F1

const findOrCreate = async (payload) => {
    try{
        let {name,component,factory} = payload
        if(!factory){
            factory = default_factory
        }
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase();
        let already_exisit = await SubComponentType.findOne({slug,component,factory});
        if(already_exisit) return already_exisit;

        let new_stop_reason = new SubComponentType({factory,component,slug,name,color_code:ColorCodeGeneratorService.getRandomColor()});
        let stop_reason = await new_stop_reason.save()

        return stop_reason;
    }catch(err){
        throw Error(err.message)
    }
}

const getList = async (payload) => {
    try{
        let {factory} = payload

        if(!factory){
            factory = default_factory
        }

        let machines = await SubComponentType.aggregate([
            {
                $match:{
                    factory,
                    slug:{
                        $ne:"all_components"
                    }
                }
            },
            {
                $lookup:{
                    from: "machinetypes",
                    localField:"component",
                    foreignField:"_id",
                    as: "machinetypes_doc"
                }
            },
            {
                $project:{
                  id:"$slug",
                  machinetypes_doc:{
                    $arrayElemAt:["$machinetypes_doc",0]
                  },
                  factory:"$factory",
                  name:"$name",
                  color:"$color_code",
                  _id:0
                }
            },
            {
                $project:{
                  id:1,
                //   machinetypes_doc:{
                //     $arrayElemAt:["$machinetypes_doc",0]
                //   },
                  component_slug:"$machinetypes_doc.slug",
                  factory:1,
                  name:1,
                  color:1,
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

const findOne = async (payload) => {
    try{
        let {slug,component,factory} = payload
        console.log(payload)
        if(!factory){
            factory = default_factory
        }
        let do_exist = await SubComponentType.findOne({component,slug,factory});
        if(!do_exist) throw Error("Sub Component Type supplied is invalid for component")

        return do_exist;
    }catch(err){
        throw Error(err.message)
    }
}

// const getAllComponentsID = async (factory) =>{
//     if(!factory){
//         factory = default_factory
//     }
//     let all_components = await findOne({"all_components",factory});
//     return all_components._id
// }
module.exports = {
    findOrCreate,
    findOne,
    getList,
    // getAllComponentsID
}