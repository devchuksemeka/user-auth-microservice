const moment = require('moment')
const SupplyModel = require('../../../models/Supply')
const ProcessService = require('../Process/ProcessService')
const {getDateLableUsingViewFormat} = require("../../index")
const SaleService = require('../Sale/SaleService')
const BaseService = require('../BaseService')



class SupplyCostService extends BaseService{
    constructor(payload){
      super(payload)
      const {revenue_category} = payload
      console.log("-- Supply Cost Service Constructor")

      
      this.supply_cateory = revenue_category
      
      this.qty_processed_b4_start_date = 0
      this.qty_processed_within_date = 0
      this.list = []
      this.processed_list_within_date = []
      this.list_above_processed_qty = []
      this.supplied_processed_list = []
      this.datasets = {}
      this.total_amount = 0
      
    }

    async generateAllList(){
      const list = await SupplyModel.aggregate([
        {
          $match:{
            factory:this.factory
          }
        },
        {
          $group:{
            _id:{
              date:"$date"
            },
            quantity_in_ton:{
              $sum:"$quantity_in_ton"
            },
            quantity_in_kg:{
              $sum:"$quantity_in_kg"
            },
            price_total:{
              $sum:"$price_total"
            }
          }
        },
        {
          $project:{
            date:"$_id.date",
            quantity_in_ton:1,
            quantity_in_kg:1,
            price_total:1,
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
        let {price_total} = supply
        price_total = getAmountAfterConversion(price_total,this.currency)
        return {
            ...supply,
            price_total
        }
    })
    }

    async setupProcessService(){
      const processService = new ProcessService(this.payload)
      await processService.generateQtyBeforeStartDate()
      await processService.generateQtyWithinDate()
      // await processService.generateProcessedListWithinDate()
      await processService.computeProcessedItemCostList()

      this.qty_processed_b4_start_date = processService.total_qty_before_start_date
      this.qty_processed_within_date = processService.total_qty_within_date

      this.processed_list_within_date = processService.list
    }

    

    async generateListAboveProcessedQty(){
      await this.setupProcessService()
      await this.generateAllList()

      let total_cumulator = 0
      this.list_above_processed_qty = this.list.filter(supply=>{
        if(total_cumulator >= this.qty_processed_b4_start_date) return true;
        total_cumulator += supply.quantity_in_ton;
      })
    }

    genDatasetFromList(list){
      list.forEach(cost => {  

        let {date,total_price} = cost

        const formatted_graphview = getDateLableUsingViewFormat(date,this.graphView)
        
        if(this.datasets[formatted_graphview] === undefined){
          this.datasets[formatted_graphview] = 0
        }

        this.datasets[formatted_graphview] += total_price
        
      });
    }

    /**
     * Function helps generate all parameters that is needed by Supply Cost
     */
    async generateAllEntities(){

      /**
       * If supply_category = production
       *   - Use the Process Service cost analysis breakdown
       * Else 
       *  - Use the Sales Service
       */
      if(this.supply_cateory === "production"){
        
        const processService = new ProcessService(this.payload)
        await processService.generateListWithinDate()
        this.datasets = processService.processed_rm_total_cost_price_within_range_dataset
        this.setTotalAmount(processService.processed_total_cost_of_good_manufactured_within_range_component.total_rm_procurement_cost)

      }else if(this.supply_cateory === "sale"){
        const saleService = new SaleService(this.payload)
        await saleService.computeListWithinRange()

        this.datasets = saleService.sales_rm_total_cost_price_within_range_dataset
        this.setTotalAmount(saleService.sales_rm_total_cost_price_within_range)

      } 
    }

    async generateTotalAmount(){

      const processService = new ProcessService(this.payload)
      await processService.computeProcessedItemCostList()
     
      this.setTotalAmount(processService.processed_total_cost_price)
    }

    async computeSuppliedProcessedList(){
      await this.generateListAboveProcessedQty()
    
      let totalSupplyAccumulator4DateRange = 0;
      let can_add_to_total_crushed_items = true;

      this.list_above_processed_qty.map(supply=>{
  
        if(can_add_to_total_crushed_items){
          totalSupplyAccumulator4DateRange += supply.quantity_in_ton
          this.supplied_processed_list.push(supply)
        }
        if(totalSupplyAccumulator4DateRange >= this.qty_processed_within_date){
          can_add_to_total_crushed_items = false;
        }
      })
    }

    async generateCostGraphViewDataset(){
      const processService = new ProcessService(this.payload)
      await processService.computeProcessedItemCostList()

      this.genDatasetFromList(processService.processed_cost_list)
    }




    setTotalAmount(amount){
      this.total_amount = amount || 0
    }
}

module.exports = SupplyCostService