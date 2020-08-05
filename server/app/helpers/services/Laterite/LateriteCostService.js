const moment = require('moment')
const DailyMetric = require('../../../models/DailyMetric')
const {getDateLableUsingViewFormat, getAmountAfterConversion} = require("../../index")
const ProcessService = require('../Process/ProcessService')
const BaseService = require('../BaseService')



class LateriteCostService extends BaseService{
    constructor(payload){
      super(payload)

        const {factory,startDate,endDate,graphView} = payload
        console.log("-- Laterite Cost Service Constructor")

        
        this.total_amount = 0
        this.datasets = {}
        this.list = []
        this.crack_mixture_p1_ratio = 0.77 // 77% 
        this.recovery_rate = 0.97 // 97% 
        this.laterite_cost_per_cracked_mixture = getAmountAfterConversion(845,this.currency) // NAIRA

        
    }

    async computeTotalAmount(){

      const processService = new ProcessService(this.payload)
      await processService.computeProcessQty()
      const processed_qty = processService.processed_qty

      this.setTotalAmount(this.getTotalAmountWithProcessQty(processed_qty))
    }

    getTotalAmountWithProcessQty(processed_qty){
      return processed_qty * this.crack_mixture_p1_ratio * this.laterite_cost_per_cracked_mixture
    }

    setTotalAmount(amount){
      this.total_amount = amount
    }
    
    async generateProcessedListGroupByDate(){
      this.list = await DailyMetric.aggregate([
        {
          $match:{
            factory:this.factory,
            date:{
              $gte:new Date(this.startDate),
              $lte:new Date(this.endDate),
            }
          }
        }, 
        {
          $group:{
            _id:"$date",
            total_processed:{
              $sum:"$input_parameters.p1_cracked_ton"
            }
          }
        }, 
        {
          $project:{
            date:"$_id",
            total_processed:1,
            _id:0
          }
        },
        {
          $sort:{
            date:1
          }
        }
      ])
    }

    async computeCostListByGraphView(){
      await this.generateProcessedListGroupByDate()

      this.list.forEach(cost => {  

        let {date,total_processed} = cost

        const formatted_graphview = getDateLableUsingViewFormat(date,this.graphView)
        
        if(this.datasets[formatted_graphview] === undefined){
          this.datasets[formatted_graphview] = 0
        }

        this.datasets[formatted_graphview] += this.getTotalAmountWithProcessQty(total_processed)
      });

    }

    setTotalAmount(amount){
      this.total_amount = amount || 0
    }
}

module.exports = LateriteCostService