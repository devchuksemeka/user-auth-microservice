const moment = require('moment')
const DailyMetric = require('../../../models/DailyMetric')
const ProcessService = require('../Process/ProcessService')
const {CONSTANT,getDateLableUsingViewFormat, getAmountAfterConversion} = require("../../index")
const BaseService = require('../BaseService')



class DirectLabourCostService extends BaseService{

    constructor(payload){

      super(payload)
      console.log("-- Direct Labour Cost Service Constructor")
      this.total_amount = 0
      this.total_monthly_amount = this.factory === "f1" ? getAmountAfterConversion(560000,this.currency) : getAmountAfterConversion(1000000,this.currency)
      this.total_daily_amount = this.total_monthly_amount/31
      this.datasets = {}
    }
    

    /**
     * Compute the total amount of direct labour cost
     * - Amount will be gotten from the occurence of processing from start to end date
     */
    async computeTotalAmount(){

      const processService = new ProcessService(this.payload)
      await processService.computeNoOfUniqueDateInDateRange()
      const total_process_days = processService.no_of_unique_days_in_date_range

      this.total_amount  = total_process_days * this.total_daily_amount

    }


    async computeAllAttributes(){
      const processService = new ProcessService(this.payload)
      await processService.computeProcessList()

      const list = processService.list

      // console.log("List",list)
      list.forEach(cost => {  

        let {date} = cost

        const formatted_graphview = getDateLableUsingViewFormat(date,this.graphView)
        
        if(this.datasets[formatted_graphview] === undefined){
          this.datasets[formatted_graphview] = 0
        }

        const amount = this.getAmount(CONSTANT.DAY)
        this.total_amount += amount
        this.datasets[formatted_graphview] += amount
        
      });

    }

    async computeCostListByGraphView(){
      const processService = new ProcessService(this.payload)
      await processService.computeProcessList()

      const list = processService.list

      list.forEach(cost => {  

        let {date} = cost

        const formatted_graphview = getDateLableUsingViewFormat(date,this.graphView)
        
        if(this.datasets[formatted_graphview] === undefined){
          this.datasets[formatted_graphview] = 0
        }

        this.datasets[formatted_graphview] += this.getAmount(this.graphView)
        
      });
    }

    getAmount(graphView){
      const {DAY,WEEK,MONTH} = CONSTANT
      if(graphView === DAY){
        return this.total_monthly_amount/31
      }
      else if(graphView === WEEK){
        return this.total_monthly_amount/4
      }
      else if(graphView === MONTH){
        return this.total_monthly_amount
      }
    }
}

module.exports = DirectLabourCostService