const DailyMetricModel = require('../../../models/DailyMetric')
const SupplyModel = require('../../../models/Supply')
const {start_of_today,CONSTANT, getAmountAfterConversion} = require("../../index")
const moment = require('moment')

class SupplyService{
    constructor(payload){
        const {factory,startDate,endDate,currency} = payload
        this.payload = payload

        this.factory = factory
        this.currency = currency
        this.startDate = moment(startDate).toDate()
        this.endDate = moment(endDate).toDate()

        this.list = []
    }

    async generateAllSupplyList(){
        const list = await SupplyModel.aggregate([
            {
                $match:{
                    factory:this.factory,
                }
            },
            {
                $group:{
                    _id:{
                        date:"$date"
                    },
                    total_price:{
                        $sum: "$price_total"
                    }, 
                    total_qty:{
                        $sum: "$quantity_in_ton"
                    }
                }
            },
            {
                $project:{
                    date:"$_id.date",
                    total_qty:1,
                    total_price:1,
                    unit_price:{
                        $divide:["$total_price","$total_qty"]
                    },
                    _id:0
                }
            },
            {
                $sort:{
                    date:1
                }
            }
        ]);
        this.list = list.map(supply=>{
            let {total_price,unit_price} = supply
            total_price = getAmountAfterConversion(total_price,this.currency)
            unit_price = getAmountAfterConversion(unit_price,this.currency)
            return {
                ...supply,
                total_price,
                unit_price
            }
        })
    }

    /**
     * 
     * @param {*} product 
     */
    async getAggregatedProductSupplyToday(product){
        product = product.toUpperCase()
        try{
            let production = await SupplyModel.aggregate([
                {
                    $match:{
                        date:{
                            $gte:new Date(start_of_today),
                        },
                        product
                    }
                },
                {
                    $group:{
                        _id:null,
                        total_price:{
                            $sum: "$price_total"
                        }, 
                        total_qty:{
                            $sum: "$quantity_in_ton"
                        }
                    }
                },
                {
                    $project:{
                        total_qty:1,
                        total_price:1,
                        _id:0
                    }
                }
            ]);
    
            let payload = {
                total_price : 0,
                total_qty : 0
            }
    
            if(production.length > 0){
                payload_d = production[0];
                payload = {
                    ...payload,
                    total_price:payload_d.total_price,
                    total_qty:payload_d.total_qty,
                }
            }
            return payload;
        }catch(err){
            throw Error(err.message)
        }
    }
}


module.exports = SupplyService