const moment = require('moment')
const DailyMetric = require('../../../models/DailyMetric')
const {getDateLableUsingViewFormat, getAmountAfterConversion} = require("../../index")
const BaseService = require('../BaseService')



class EnergyCostService extends BaseService{
    constructor(payload){
      super(payload)
        // const {factory,startDate,endDate,graphView} = payload
        console.log("-- Energy Cost Service Constructor")

        this.total_amount = 0
        this.datasets = {}
        this.list = []
        
    }
    

    async generateTotalAmount(){
      let maintenance_cost = await DailyMetric.aggregate([
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
            _id:null,
            total_amount:{
              $sum:"$cost_of_diesel_used"
            }
          }
        }, 
        {
          $project:{
            total_amount:1,
            _id:0
          }
        }
      ])
      const amount = maintenance_cost.length > 0 ? maintenance_cost[0].total_amount : 0
      this.setTotalAmount(getAmountAfterConversion(amount,this.currency))
    }

    async generateCostListGroupByDate(){
      const list = await DailyMetric.aggregate([
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
            total_amount:{
              $sum:"$cost_of_diesel_used"
            }
          }
        }, 
        {
          $project:{
            date:"$_id",
            total_amount:1,
            _id:0
          }
        },
        {
          $sort:{
            date:1
          }
        }
      ])
      this.list = list.map(diesel=>{
        let {total_amount} = diesel
        total_amount = getAmountAfterConversion(total_amount,this.currency)
        return {
          ...diesel,
          total_amount
        }
      })
    }

    async computeCostListByGraphView(){
      await this.generateCostListGroupByDate()

      // const datasets = {}
      this.list.forEach(cost => {  

        let {date,total_amount} = cost

        const formatted_graphview = getDateLableUsingViewFormat(date,this.graphView)
        
        if(this.datasets[formatted_graphview] === undefined){
          this.datasets[formatted_graphview] = 0
        }

        this.datasets[formatted_graphview] += total_amount
        
      });
    }

    setTotalAmount(amount){
      this.total_amount = amount || 0
    }
}

module.exports = EnergyCostService