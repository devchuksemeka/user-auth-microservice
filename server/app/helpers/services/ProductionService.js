const DailyMetricModel = require('../../models/DailyMetric')
const {getWeekStartAndEndDate,start_of_today,end_of_today,CONSTANT} = require("../index")
const moment = require('moment')

const getProductTotalProductionThisWeek = async (product) => {
    product = product.toUpperCase()
    let {start_date,end_date} = getWeekStartAndEndDate()
    try{
        let production = await DailyMetricModel.aggregate([
            {
                $match:{
                    date:{
                        $gte:new Date(start_date),
                        $lte:new Date(end_date),
                    },
                }
            },
            {
                $group:{
                    _id:null,
                    total_production:{
                        $sum: product === CONSTANT.PKO ? "$pko_produced":"$pkc_produced"
                    }
                }
            },
            {
                $project:{
                    total_production:1,
                    _id:0
                }
            }
        ]);

        let total_production = production.length > 0 ? production[0].total_production : 0
        return total_production;
    }catch(err){
        throw Error(err.message)
    }
}

const getProductTotalProductionToday = async (product) => {
    product = product.toUpperCase()
    try{
        let production = await DailyMetricModel.aggregate([
            {
                $match:{
                    date:{
                        $gte:new Date(start_of_today),
                    },
                }
            },
            {
                $group:{
                    _id:null,
                    total_production:{
                        $sum: product === CONSTANT.PKO ? "$pko_produced":"$pkc_produced"
                    }
                }
            },
            {
                $project:{
                    total_production:1,
                    _id:0
                }
            }
        ]);

        let total_production = production.length > 0 ? production[0].total_production : 0
        return total_production;
    }catch(err){
        throw Error(err.message)
    }
}

module.exports = {
    getProductTotalProductionThisWeek,
    getProductTotalProductionToday
}