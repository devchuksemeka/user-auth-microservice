const MaintenanceTracker = require('../../models/MaintenanceTracker')
const StopIdService = require('./MaintenanceReferenceService')
const StatusService = require('./MaintenanceImplementationStatusService')
const CheckPointService = require('./MachineMaintenanceCheckpointService')
const ComponentService = require('./MachineTypeService')
const MachineStopReasonService = require('./MachineStopReasonService')
const SubComponentService = require('./SubComponentTypeService')
const MaintenanceActionService = require('./MaintenanceActionService')
const RepairRpsService = require('./MaintenanceRepairRpsService')
const StopReasonModel = require('../../models/F1StopReason')
const mongoose = require('mongoose')

const {CONSTANT} = require("../../helpers")
const moment = require('moment')

const default_factory = CONSTANT.FACTORIES.F1

const create = async (payload) => {
    try{
        let {
            factory,
            stop_id,
            status,
            checkpoint,component,
            sub_component,
            maintenance_action,
            rps,
            root_cause,
            prev_id,diagnosis_details,
            time_of_issue,time_of_completion,
            cost,

        } = payload

        let status_of_implementation = undefined
        let equipment = undefined
        let reference_id = undefined
        let responsibilty_party = []

        if(!factory) throw Error("Factory must be provided")

        // check if stop id is valid
        if(stop_id){
            let stop_id_model = await StopIdService.findOne(stop_id,factory)
            reference_id = stop_id_model._id
        }
        
        // check if status is valid
        if(status){
            let status_model = await StatusService.findOne(status,factory)
            status_of_implementation = status_model._id
        }
        // check if checkpoint is valid
        if(checkpoint){
            let checkpoint_model  = await CheckPointService.findOne(checkpoint,factory)
            checkpoint = checkpoint_model._id
        }else{
            checkpoint = undefined
        }
       
        // check if component is valid
        if(component){
            let component_model = await ComponentService.findOne(component,factory)
            equipment = component_model._id
        }
        

        // check if sub component is valid
        if(sub_component){
            let sub_component_model = await SubComponentService.findOne({slug:sub_component,component:equipment,factory})
            
            sub_component = sub_component_model._id
        }else{
            sub_component = undefined
        }

        

        // check if maintenance action is valid
        if(maintenance_action){
            let maintenance_action_model = await MaintenanceActionService.findOne(maintenance_action,factory)
            maintenance_action = maintenance_action_model._id
        }
        

        // check if maintenance action is valid
        if(rps){
            responsibilty_party = await RepairRpsService.getValidRpIDs({rps,factory})
            
        }


        // if(already_exist) throw Error("Stop Reason with same Stop ID already supplied")

        let issue_tracker_doc = new MaintenanceTracker({
            factory,
            reference_id,
            status_of_implementation,
            checkpoint,
            equipment,
            sub_component,
            maintenance_action,
            responsibilty_party,
            root_cause,
            previous_maintenance_no:prev_id,
            diagnosis_details,
            time_of_issue,
            time_of_completion,
            date:time_of_issue,
            cost
        });

        let doc = await issue_tracker_doc.save()

        return doc;
    }catch(err){
        throw Error(err.message)
    }
}

const update = async (payload) => {
    try{

        let {
            factory,
            stop_id,
            stop_type,
            stop_description,
            status,
            checkpoint,component,
            sub_component,
            maintenance_action,
            rps,
            root_cause,
            prev_id,diagnosis_details,
            time_of_issue,time_of_completion,
            cost,
        } = payload

        let status_of_implementation = undefined
        let equipment = undefined
        let reference_id = undefined
        let responsibilty_party = []

        if(!factory) throw Error("Factory must be provided")

        if(!stop_id) throw Error("Stop ID must be provided")

        // check if stop id is valid
        let stop_id_model = await StopIdService.findOne(stop_id,factory)
        reference_id = stop_id_model._id


         // check if stop id is valid
         let stop_reason_model = await MachineStopReasonService.findOne(stop_type,factory)
         stop_type = stop_reason_model._id
        
        // check if status is valid
        if(status){
            let status_model = await StatusService.findOne(status,factory)
            status_of_implementation = status_model._id
        }
        // check if checkpoint is valid
        if(checkpoint){
            let checkpoint_model  = await CheckPointService.findOne(checkpoint,factory)
            checkpoint = checkpoint_model._id
        }else{
            checkpoint = undefined
        }
       
        // check if component is valid
        if(component){
            let component_model = await ComponentService.findOne(component,factory)
            equipment = component_model._id
        }
        

        // check if sub component is valid
        if(sub_component){
            let sub_component_model = await SubComponentService.findOne({slug:sub_component,component:equipment,factory})
            
            sub_component = sub_component_model._id
        }else{
            sub_component = undefined
        }

        

        // check if maintenance action is valid
        if(maintenance_action){
            let maintenance_action_model = await MaintenanceActionService.findOne(maintenance_action,factory)
            maintenance_action = maintenance_action_model._id
        }
        

        // check if maintenance action is valid
        if(rps){
            responsibilty_party = await RepairRpsService.getValidRpIDs({rps,factory})
            
        }

        console.log(responsibilty_party)
        
        /**
         * Check if stop_id exist
         *
         */

        const stopReasonModel =await StopReasonModel.findOne({
            stop_id:reference_id
        });

        if(!stop_reason_model) throw Error("Invalid Stop ID provided")

        // if(already_exist) throw Error("Stop Reason with same Stop ID already supplied")
        const issue_tracker =await MaintenanceTracker.findOne({
            reference_id
        });

        if(!issue_tracker) throw Error("Failed, not issue with Stop ID found")

        /**
        * Update Stop Reason Model
        */
       stopReasonModel.stop_reason = stop_type
       stopReasonModel.stop_reason_description = stop_description

       await stopReasonModel.save()

        issue_tracker.sub_component = sub_component
        issue_tracker.maintenance_action = maintenance_action
        issue_tracker.responsibilty_party = responsibilty_party
        issue_tracker.root_cause = root_cause
        issue_tracker.previous_maintenance_no = prev_id
        issue_tracker.diagnosis_details = diagnosis_details

        await issue_tracker.save()

        return {
            status:true,
            payload:issue_tracker
        }
        

        let issue_tracker_doc = new MaintenanceTracker({
            factory,
            reference_id,
            status_of_implementation,
            checkpoint,
            equipment,
            sub_component,
            maintenance_action,
            responsibilty_party,
            root_cause,
            previous_maintenance_no:prev_id,
            diagnosis_details,
            time_of_issue,
            time_of_completion,
            cost
        });

        let doc = await issue_tracker_doc.save()

        return doc;
    }catch(err){
        throw Error(err.message)
    }
}

const createMaintenanceAction = async (payload) => {
    try{
        let {
            factory,
            stop_id,
            rps,
            maintenance_action,
            cost
        } = payload

        let reference_id = undefined
        let responsibilty_party = []


        if(!factory) throw Error("Factory must be provided")
        // check if stop id is valid
        if(stop_id){
            let stop_id_model = await StopIdService.findOne(stop_id,factory)
            reference_id = stop_id_model._id
        }


        let issue_tracker_doc = await MaintenanceTracker.findOne({
            reference_id
        });
        if(!issue_tracker_doc) throw Error("Invalid Issue Supplied")

        // check if maintenance action is valid
        if(maintenance_action){
            let maintenance_action_model = await MaintenanceActionService.findOne(maintenance_action,factory)
            maintenance_action = maintenance_action_model._id
        }

        // check if maintenance action is valid
        if(rps){
            responsibilty_party = await RepairRpsService.getValidRpIDs({rps,factory})
        }
        
        // update the issue tracker

        issue_tracker_doc.responsibilty_party = rps
        issue_tracker_doc.maintenance_action = maintenance_action
        issue_tracker_doc.cost = cost

        let doc = await issue_tracker_doc.save()

        return doc;
    }catch(err){
        throw Error(err.message)
    }
}

const findOne = async (payload) => {
    try{
        let do_exist = await MaintenanceTracker.findOne(payload)

        return do_exist;
    }catch(err){
        throw Error(err.message)
    }
}

const getList = async (payload) => {
   
    try{
        let {factory} = payload
        let list = [];
        list = await MaintenanceTracker.aggregate([
            {
                $match:{
                    factory,
                }
            },
            {
                $project:{
                    status:"$status_of_implementation",
                    stop_id:"$reference_id",
                    checkpoint:"$checkpoint",
                    factory:"$factory",
                    start:"$time_of_issue",
                    stop:"$time_of_completion",
                    maintenance_action:"$maintenance_action",
                    component:"$equipment",
                    sub_component:"$sub_component",
                    rps:"$responsibilty_party",
                    diagnosis_details:"$diagnosis_details",
                    root_cause:"$root_cause",
                    cost:"$cost",
                    prev_id:"$previous_maintenance_no",
                }
            },
            {
                $lookup:{
                    from:"maintenanceimplementationstatuses",
                    as:"status_doc",
                    localField:"status",
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
                $lookup:{
                    from:"f1stopreasons",
                    as:"stops_doc",
                    localField:"stop_id",
                    foreignField:"stop_id",
                }
            },
            {
                $lookup:{
                    from:"machinemaintenancecheckpoints",
                    as:"checkpoint_doc",
                    localField:"checkpoint",
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
                    from:"subcomponenttypes",
                    as:"sub_component_doc",
                    localField:"sub_component",
                    foreignField:"_id",
                }
            },
            {
                $lookup:{
                    from:"maintenanceactions",
                    as:"maintenance_action_doc",
                    localField:"maintenance_action",
                    foreignField:"_id",
                }
            },
            {
                $lookup:{
                    from:"maintenancerepairrps",
                    as:"rps_array",
                    localField:"rps",
                    foreignField:"_id",
                }
            },
            {
                $project:{
                    status_doc:{
                        $arrayElemAt:["$status_doc",0]
                    },
                    stop_id_doc:{
                        $arrayElemAt:["$stop_id_doc",0]
                    },
                    stops_doc:{
                        $arrayElemAt:["$stops_doc",0]
                    },
                    checkpoint_doc:{
                        $arrayElemAt:["$checkpoint_doc",0]
                    },
                    stop_id:"$alt_reference",
                    factory:1,
                    start:1,
                    stop:1,
                    maintenance_action_doc:{
                        $arrayElemAt:["$maintenance_action_doc",0]
                    },
                    sub_component_doc:{
                        $arrayElemAt:["$sub_component_doc",0]
                    },
                    rps:"$rps_array",
                    diagnosis_details:1,
                    root_cause:1,
                    cost:1,
                    prev_id:1,
                }
            },
            {
                $lookup:{
                    from:"machinetypes",
                    as:"component_doc",
                    localField:"stops_doc.component",
                    foreignField:"_id",
                }
            },
            {
                $project:{
                    status_payload:"$status_doc",
                    status:"$status_doc.name",
                    stops_payload:"$stops_doc",
                    stop_id:"$stops_doc.alt_reference",
                    stop_id_payload:"$stop_id_doc",
                    checkpoint:"$checkpoint_doc.name",
                    checkpoint_payload:"$checkpoint_doc",
                    factory:1,
                    start:1,
                    stop:1,
                    maintenance_action:"$maintenance_action_doc.name",
                    maintenance_action_payload:"$maintenance_action_doc",
                    sub_component:"$sub_component_doc.name",
                    sub_component_payload:"$sub_component_doc",
                    component_payload:{
                        $arrayElemAt:["$component_doc",0]
                    },
                    rps:1,
                    diagnosis_details:1,
                    root_cause:1,
                    cost:1,
                    prev_id:1,
                }
            },
            {
                $project:{
                    status_payload:1,
                    status:1,
                    stops_payload:1,
                    stop_id:1,
                    stop_id_payload:1,
                    checkpoint:1,
                    checkpoint_payload:1,
                    factory:1,
                    start:1,
                    stop:1,
                    maintenance_action:1,
                    maintenance_action_payload:1,
                    component:"$component_payload.name",
                    component_payload:1,
                    sub_component:1,
                    sub_component_payload:1,
                    rps:1,
                    diagnosis_details:1,
                    root_cause:1,
                    cost:1,
                    prev_id:1,
                }
            },
            {
                $sort:{
                    start:-1,
                    // stop_id:-1
                }
            }
        ]);
       
        return list
    }catch(err){
        throw Error(err.message)
    }
}

const getUnClosedIssuedList = async (payload) => {
    try{
        let {factory} = payload
        let list = [];
        list = await MaintenanceTracker.aggregate([
            {
                $match:{
                    factory,
                    time_of_completion : { $exists: false }
                }
            },
            {
                $project:{
                    status:"$status_of_implementation",
                    stop_id:"$reference_id",
                    checkpoint:"$checkpoint",
                    factory:"$factory",
                    start:"$time_of_issue",
                    stop:"$time_of_completion",
                    maintenance_action:"$maintenance_action",
                    sub_component:"$sub_component",
                    rps:"$responsibilty_party",
                    diagnosis_details:"$diagnosis_details",
                    root_cause:"$root_cause",
                    cost:"$cost",
                    prev_id:"$previous_maintenance_no",
                }
            },
            {
                $lookup:{
                    from:"maintenanceimplementationstatuses",
                    as:"status_doc",
                    localField:"status",
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
                $lookup:{
                    from:"f1stopreasons",
                    as:"stops_doc",
                    localField:"stop_id",
                    foreignField:"stop_id",
                }
            },
            {
                $lookup:{
                    from:"machinemaintenancecheckpoints",
                    as:"checkpoint_doc",
                    localField:"checkpoint",
                    foreignField:"_id",
                }
            },
            
            {
                $lookup:{
                    from:"subcomponenttypes",
                    as:"sub_component_doc",
                    localField:"sub_component",
                    foreignField:"_id",
                }
            },
            {
                $lookup:{
                    from:"maintenanceactions",
                    as:"maintenance_action_doc",
                    localField:"maintenance_action",
                    foreignField:"_id",
                }
            },
            {
                $lookup:{
                    from:"maintenancerepairrps",
                    as:"rps_array",
                    localField:"rps",
                    foreignField:"_id",
                }
            },
            {
                $project:{
                    status_doc:{
                        $arrayElemAt:["$status_doc",0]
                    },
                    stop_id_doc:{
                        $arrayElemAt:["$stop_id_doc",0]
                    },
                    stops_doc:{
                        $arrayElemAt:["$stops_doc",0]
                    },
                    checkpoint_doc:{
                        $arrayElemAt:["$checkpoint_doc",0]
                    },
                    stop_id:"$alt_reference",
                    factory:1,
                    start:1,
                    stop:1,
                    maintenance_action_doc:{
                        $arrayElemAt:["$maintenance_action_doc",0]
                    },
                    sub_component_doc:{
                        $arrayElemAt:["$sub_component_doc",0]
                    },
                    rps:"$rps_array",
                    diagnosis_details:1,
                    root_cause:1,
                    cost:1,
                    prev_id:1,
                }
            },
            {
                $lookup:{
                    from:"machinetypes",
                    as:"component_doc",
                    localField:"stops_doc.component",
                    foreignField:"_id",
                }
            },
            {
                $project:{
                    status_payload:"$status_doc",
                    status:"$status_doc.name",
                    stops_payload:"$stops_doc",
                    stop_id:"$stops_doc.alt_reference",
                    stop_id_payload:"$stop_id_doc",
                    checkpoint:"$checkpoint_doc.name",
                    checkpoint_payload:"$checkpoint_doc",
                    factory:1,
                    start:1,
                    stop:1,
                    maintenance_action:"$maintenance_action_doc.name",
                    maintenance_action_payload:"$maintenance_action_doc",
                    sub_component:"$sub_component_doc.name",
                    sub_component_payload:"$sub_component_doc",
                    component_payload:{
                        $arrayElemAt:["$component_doc",0]
                    },
                    rps:1,
                    diagnosis_details:1,
                    root_cause:1,
                    cost:1,
                    prev_id:1,
                }
            },
            {
                $project:{
                    status_payload:1,
                    status:1,
                    stops_payload:1,
                    stop_id:1,
                    stop_id_payload:1,
                    checkpoint:1,
                    checkpoint_payload:1,
                    factory:1,
                    start:1,
                    stop:1,
                    maintenance_action:1,
                    maintenance_action_payload:1,
                    component:"$component_payload.name",
                    component_payload:1,
                    sub_component:1,
                    sub_component_payload:1,
                    rps:1,
                    diagnosis_details:1,
                    root_cause:1,
                    cost:1,
                    prev_id:1,
                }
            },
            {
                $sort:{
                    start:-1,
                }
            }
        ]);
       
        return list
    }catch(err){
        throw Error(err.message)
    }
}


module.exports = {
    // findOrCreate,
    create,
    update,
    // findOne,
    createMaintenanceAction,
    getList,
    getUnClosedIssuedList
}