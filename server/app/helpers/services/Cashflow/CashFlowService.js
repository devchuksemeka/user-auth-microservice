const {getDateLableUsingViewFormat,CONSTANT, getAmountAfterConversion} = require("../../index")
const ProcessService = require('../Process/ProcessService');
const BaseService = require('../BaseService');
const SaleService = require('../Sale/SaleService');

class CashFlowService extends BaseService{

    constructor(payload){
      super(payload)
      this.processService = null
      this.saleService = null
    }

    async computeListWithinRange(){

      // Compute the process within range
      await this.computeProcessListWithinRange()

      // Compute the sales within range
      await this.computeSaleListWithinRange()

    }

    /**
     * Compute the processes list of items within range
     */
    async computeProcessListWithinRange(){

      // Compute the process within range
      this.processService = new ProcessService(this.payload)
      await this.processService.generateListWithinDate()
    }

    /**
     * Compute the sales list of items within range
     */
    async computeSaleListWithinRange(){

      // Compute the sales within range
      this.saleService = new SaleService(this.payload)
      await this.saleService.computeListWithinRange()

    }
}


module.exports = CashFlowService