const moment = require('moment')

const {
  getInventoryValue,
  getDateLableUsingViewFormat
} = require('../../../index')
const ProcessService = require('../../Process/ProcessService')
const MarketPriceService = require('../../MarketPrice/MarketPriceServices')

class ProductionRevenueService{

    constructor(payload){
        const {factory,startDate,endDate,currency,graphView} = payload
        console.log("-- Production Revenue Service Constructor")

        this.payload = payload
        this.factory = factory
        this.graphView = graphView
        this.startDate = moment(startDate).toDate()
        this.endDate = moment(endDate).toDate()
        this.productions_list = []
        this.market_price_list = []
        this.total_amount = 0
        this.drivers = {}
        this.datasets = {}
    }
    
    async computeRevenue() {
      await this.setProductionList()
      await this.setMarketPriceList()

      this.productions_list.forEach(supply => {  
        this.total_amount += getInventoryValue({
          supply,
          market_price_dataset:this.market_price_list,
          factory:this.factory
        })
      });
    }

    async setProductionList(){
      const processService = new ProcessService(this.payload)
      await processService.generateListWithinDate()
      this.productions_list = processService.list_within_date
    }

    async setMarketPriceList(){
      const marketPriceService = new MarketPriceService(this.payload)
      await marketPriceService.generateListUpTillEndDate()
      this.market_price_list = marketPriceService.list_up_till_end_date
    }

    async computeRevenueListByGraphView(){
      await this.setProductionList()
      await this.setMarketPriceList()

      // const datasets = {}
      this.productions_list.forEach(supply => {  

        let {date} = supply

        const formatted_graphview = getDateLableUsingViewFormat(date,this.graphView)
        
        if(this.datasets[formatted_graphview] === undefined){
          this.datasets[formatted_graphview] = 0
        }

        const total_amount = getInventoryValue({
          supply,
          market_price_dataset:this.market_price_list,
          factory:this.factory
        })

        this.datasets[formatted_graphview] += total_amount
       
      });

    }

}

module.exports = ProductionRevenueService