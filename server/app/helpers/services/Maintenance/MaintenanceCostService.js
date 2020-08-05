const moment = require('moment')
const IssueTracker = require('../../../models/MaintenanceTracker')
const {getDateLableUsingViewFormat, getAmountAfterConversion} = require("../../index")
const BaseService = require('../BaseService')



class MaintenanceCostService extends BaseService{
    constructor(payload){
      super(payload)

        // const {factory,startDate,endDate,graphView,currency} = payload
        console.log("-- Maintenance Cost Service Constructor")

        this.total_amount = 0
        this.list = []
        this.maintenance_cost_all_time_list = []
        this.datasets = {}
        
    }

    /**
     * Compute all maintenance cost list
     */
    async computeAllTimeList(){
      const list = await IssueTracker.aggregate([
        {
          $match:{
            factory:this.factory
          }
        }, 
        {
          $group:{
            _id:"$date",
            total_amount:{
              $sum:"$cost"
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
      
      this.maintenance_cost_all_time_list = list.map(maintenance => {
        let {total_amount} = maintenance
        total_amount = getAmountAfterConversion(total_amount,this.currency)
        return {
          ...maintenance,
          total_amount
        }
      })

    }
    

    async generateTotalAmount(){
        let maintenance_cost = await IssueTracker.aggregate([
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
                  $sum:"$cost"
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

        let amount = maintenance_cost.length > 0 ? maintenance_cost[0].total_amount : 0
        this.total_amount = getAmountAfterConversion(amount,this.currency)
    }

    async generateCostListGroupByDate(){
      const list = await IssueTracker.aggregate([
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
              $sum:"$cost"
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
      this.list = list.map(maintenance => {
        let {total_amount} = maintenance
        total_amount = getAmountAfterConversion(total_amount,this.currency)
        return {
          ...maintenance,
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

}

module.exports = MaintenanceCostService