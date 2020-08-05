const moment = require('moment')

const {
  getInventoryValue,
} = require('../../index')
const BaseService = require('../BaseService')

class GrossMarginService extends BaseService{

    constructor(payload){
      super(payload)
        const {total_revenue,total_cogs} = payload
        console.log("-- Economic Inventory Value Service Constructor")
        
        this.total_revenue = total_revenue || 0
        this.total_cogs = total_cogs || 0
        this.gross_profit = 0
        this.gross_margin = 0
    }


    async computeGrossProfit(){
        this.gross_profit = this.total_revenue - this.total_cogs
    }

    async computeGrossMargin(){
        await this.computeGrossProfit() 
        if(this.total_revenue){
          this.setGrossMargin(this.gross_profit/this.total_revenue * 100)
        }
       
    }

    setGrossMargin(margin){
      this.gross_margin = parseFloat(margin.toFixed(2))
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

module.exports = GrossMarginService