const moment = require('moment')

const {
  getDateLableUsingViewFormat,
  CONSTANT,
  getMarketPriceValueForOptionsFilterWithProduct,
  getProductionInventoryComputedDataset
} = require('../../../index')
const ProductionRevenueService = require('../RevenueServices/ProductionRevenueService')

class GrossMarginChartService{

    constructor(payload){
        const {factory,startDate,endDate,production_list,market_price_list,currency,graphView} = payload
        console.log("-- Gross Margin Chart Service Constructor")

        this.factory = factory
        this.currency = currency
        this.payload = payload
        this.graphView = graphView
        this.startDate = moment(startDate).toDate()
        this.endDate = moment(endDate).toDate()
        this.production_list = production_list
        this.market_price_list = market_price_list
        this.datasets = {}
        this.labels = []
    }


    async generateProductionInventoryChart(){
      let inventory_value = 0
      this.production_list.forEach(supply => {  
        // total_product_produced += supply.total_product_produced
        let date = supply.date;
    
        let formatted_date = getDateLableUsingViewFormat(date,CONSTANT.DAY);
    
        let result_dataset = getProductionInventoryComputedDataset({
          market_price_dataset:this.market_price_list,
          supply,
          factory:this.factory,
          currency:this.currency
        })

        let {current_inventory} = result_dataset
        current_inventory = parseFloat(current_inventory.toFixed(2))
        inventory_value += current_inventory
        inventory_value = parseFloat(inventory_value.toFixed(2))
        
        this.datasets[formatted_date] = {
          ...supply,
          ...result_dataset,
          current_inventory,
          inventory_value
        }
      });

      this.labels = Object.keys(this.datasets);
    }


}

module.exports = GrossMarginChartService