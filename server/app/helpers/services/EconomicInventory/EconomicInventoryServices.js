const moment = require('moment')

const {
  getInventoryValue,
} = require('../../index')

class EconomicInventoryService{

    constructor(payload){
        const {factory,startDate,endDate,productions_list,market_price_list} = payload
        console.log("-- Economic Inventory Value Service Constructor")

        this.factory = factory
        this.startDate = moment(startDate).toDate()
        this.endDate = moment(endDate).toDate()
        this.productions_list = productions_list
        this.market_price_list = market_price_list
        this.total_amount = 0
    }
    

    async generateTotalAmount() {
      this.productions_list.forEach(supply => {  
        this.total_amount += getInventoryValue({
          supply,
          market_price_dataset:this.market_price_list,
          factory:this.factory
        })
      });
    }

}

module.exports = EconomicInventoryService