const MaintenanceReferenceModel = require('../../models/MaintenanceReference')
const StopReasoneModel = require('../../models/F1StopReason')
const ColorCodeGeneratorService = require('./ColorCodeGeneratorService')
const {CONSTANT} = require("../../helpers")

const default_factory = CONSTANT.FACTORIES.F1
const findOrCreateReference = async (name,factory) => {
    if(!factory){
        factory = default_factory
    }
    try{
        let slug = name.replace(/\s/g,"_");
        slug = slug.toLowerCase();
        let already_exisit = await MaintenanceReferenceModel.findOne({slug,factory});
        if(already_exisit) return already_exisit;

        let new_stop_reason = new MaintenanceReferenceModel({factory,slug,name,color_code:ColorCodeGeneratorService.getRandomColor()});
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
        let do_exist = await MaintenanceReferenceModel.findOne({slug,factory});
        if(!do_exist) throw Error("Maintenance Reference supplied is invalid")

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
        // let machines = await MaintenanceReferenceModel.aggregate([
        //     {
        //         $match:{
        //             factory
        //         }
        //     },
        //     {
        //         $project:{
        //           id:"$slug",
        //           name:"$name",
        //         }
        //     },
        //     // use the name to join with stops to get perfect Stop iDs
        //     {
        //         $lookup:{
        //             from:"f1stopreasons",
        //             localField:"_id",
        //             foreignField:"stop_id",
        //             as:"stops"
        //         }
        //     },
        //     {
        //         $sort:{
        //             name:1
        //         }
        //     }
        // ]);
        let list = await StopReasoneModel.aggregate([
            {
                $match:{
                    factory
                }
            },
            {
                $project:{
                  alt_reference:"$alt_reference",
                  stop_id:"$stop_id",
                  _id:0
                }
            },
            // use the name to join with stops to get perfect Stop iDs
            {
                $lookup:{
                    from:"maintenancereferences",
                    localField:"stop_id",
                    foreignField:"_id",
                    as:"stop_id_doc"
                }
            },
            {
                $project:{
                  alt_reference:"$alt_reference",
                  stop_id:"$stop_id",
                  stop_id_doc:{
                      $arrayElemAt:["$stop_id_doc",0]
                  },
                }
            },

            {
                $project:{
                  id:"$stop_id_doc.slug",
                  name:"$alt_reference",
                  alt_reference:1,
                  stop_id_doc:1,
                }
            },
            // {
            //     $sort:{
            //         name:1
            //     }
            // }
        ]);

        return list
    }catch(err){
        throw Error(err.message)
    }
}

module.exports = {
    findOrCreateReference,
    getList,
    findOne
}