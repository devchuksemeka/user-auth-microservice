const F1StopReason = require('../../models/F1StopReason')
const ColorCodeGeneratorService = require('./ColorCodeGeneratorService')

// const MaintenanceReferenceService = require('./')

const {CONSTANT} = require("../../helpers")

const default_factory = CONSTANT.FACTORIES.F1

// const findOrCreate = async (name,factory) => {
//     try{
//         if(!factory){
//             factory = default_factory
//         }
//         let slug = name.replace(/\s/g,"_");
//         slug = slug.toLowerCase()
//         let already_exisit = await MaintenanceActionModel.findOne({factory,slug});
//         if(already_exisit) return already_exisit;

//         let new_stop_reason = new MaintenanceActionModel({factory,slug,name,color_code:ColorCodeGeneratorService.getRandomColor()});
//         let stop_reason = await new_stop_reason.save()

//         return stop_reason;
//     }catch(err){
//         throw Error(err.message)
//     }
// }

const create = async (payload) => {
    try{
        let {
            factory,
            stop_id,
        } = payload

        

        let already_exist = await findOne({factory,stop_id});
        if(already_exist) throw Error("Stop Reason with same Stop ID already supplied")

        let stop_reason_doc = new F1StopReason(payload);

        let doc = await stop_reason_doc.save()

        return doc;
    }catch(err){
        throw Error(err.message)
    }
}

const findOne = async (payload) => {
    try{
        let do_exist = await F1StopReason.findOne(payload);

        return do_exist;
    }catch(err){
        throw Error(err.message)
    }
}

const getList = async (payload) => {
   
    try{
        let {factory,stop_id,stop_reason,component} = payload
        if(!factory){
            factory = default_factory
        }
       let machines = [];
        machines = await F1StopReason.aggregate([
            {
                $match:{
                    factory,
                }
            },
            {
                $project:{
                    stop_id:"$stop_id",
                    alt_reference:"$alt_reference",
                    factory:"$factory",
                    stop_reason:"$stop_reason",
                    component:"$component",
                    stop_reason_description:"$stop_reason_description",
                    createdAt:1,
                    _id:0
                }
            },
            {
                $lookup:{
                    from:"machinestopreasons",
                    as:"stop_reason_doc",
                    localField:"stop_reason",
                    foreignField:"_id",
                }
            },
            {
                $lookup:{
                    from:"machinetypes",
                    as:"component_doc",
                    localField:"component",
                    foreignField:"_id",
                }
            },
            {
                $lookup:{
                    from:"maintenancereferences",
                    as:"stop_id_doc",
                    localField:"stop_id",
                    foreignField:"_id",
                }
            },
            {
                $project:{
                    stop_id:1,
                    alt_reference:1,
                    stop_id_doc:{
                        $arrayElemAt:["$stop_id_doc",0]
                    },
                    factory:1,
                    stop_reason:1,
                    stop_reason_doc:{
                        $arrayElemAt:["$stop_reason_doc",0]
                    },
                    component:1,
                    component_doc:{
                        $arrayElemAt:["$component_doc",0]
                    },
                    stop_reason_description:1,
                    createdAt:1,
                }
            },
            {
                $project:{
                    alt_reference:"$stop_id_doc.name",
                    stop_id:"$alt_reference",
                    factory:1,
                    stop_reason:"$stop_reason_doc.name",
                    component:"$component_doc.name",
                    stop_reason_description:1,
                    createdAt:1,
                }
            },
            {
                $sort:{
                    createdAt:-1
                }
            }
        ]);
        return machines
    }catch(err){
        throw Error(err.message)
    }
}


module.exports = {
    // findOrCreate,
    create,
    // findOne,
    getList
}