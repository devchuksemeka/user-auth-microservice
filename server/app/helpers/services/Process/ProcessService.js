const moment = require('moment')
const DailyMetricModel = require('../../../models/DailyMetric')
const SupplyService = require('../Supply/SupplyService')
const {getDateLableUsingViewFormat,getProductionInventoryComputedDataset,CONSTANT, getAmountAfterConversion} = require("../../index")
const MarketPriceService = require('../MarketPrice/MarketPriceServices')
const BaseService = require('../BaseService')
const DirectLabourCostService = require('../DirectLabour/DirectLabourCostService')
const LateriteCostService = require('../Laterite/LateriteCostService')
const MaintenanceCostService = require('../Maintenance/MaintenanceCostService')

class ProcessService extends BaseService{

    constructor(payload){
      super(payload)

      // const {process_category} = payload
      console.log("-- Processing Service Constructor")
      
      this.total_qty_before_start_date = 0
      this.total_qty_within_date = 0
      this.list = []
      
      this.list_within_date = []
      this.no_of_unique_days_in_date_range = 0
      this.processed_qty = 0

      // Attributes use to get processsed items
      this.processed_total_cost_price = 0
      this.processed_cost_list = []

      // ALL time process properties
      this.processed_all_time_list = []
      this.processed_all_time_cost_list = []
      this.processed_all_time_total_price = 0
      this.processed_all_time_total_qty = 0

        // Before range process properties
      this.processed_list_before_range = []
      this.processed_total_price_before_range = 0
      this.processed_total_qty_before_range = 0

      // Within range process properties
      this.processed_list_within_range = []
      this.processed_total_price_within_range = 0
      this.processed_rm_total_cost_price_within_range = 0
      this.processed_total_qty_within_range = 0
      this.processed_total_price_within_range_dataset = {}
      this.processed_rm_total_cost_price_within_range_dataset = {}
      this.processed_accumulated_inventory_within_range_dataset = {}
      this.processed_accumulated_inventory_within_range_labels = []
      this.processed_total_cost_of_good_manufactured_within_range = 0
      this.processed_total_cost_of_good_manufactured_within_range_dataset = {}
      this.processed_total_cost_of_good_manufactured_within_range_component = {
        total_direct_labour_cost:0,
        total_maintenance_cost:0,
        total_laterite_cost:0,
        total_energy_cost:0,
        total_rm_procurement_cost:0
      }

      // cost of good manufactured
      
    }

    async generateQtyBeforeStartDate(){
      let total_qty_processed = await DailyMetricModel.aggregate([
        {
          $match:{
            factory:this.factory,
            date:{
              $lt: new Date(this.startDate)
            }
          }
        },
        {
          $group:{
            _id:"$product",
            total_crushed:{
              $sum:this.factory === "f1" ? "$p2_in_ton" : "$input_parameters.p1_cracked_ton"
            }
          }
        },
        {
          $project:{
            total_crushed:1,
            _id:0
          }
        },
        {
          $limit:1 
        },
      ]);

      this.total_qty_before_start_date = total_qty_processed.length > 0 ? total_qty_processed[0].total_crushed : 0
    }

    async generateQtyWithinDate(){
      let total_qty_processed = await DailyMetricModel.aggregate([
        {
          $match:{
            factory:this.factory,
            date:{
              $gte: new Date(this.startDate),
              $lte: new Date(this.endDate)
            }
          }
        },
        {
          $group:{
            _id:"$product",
            total_crushed:{
              $sum:this.factory === "f1" ? "$p2_in_ton" : "$input_parameters.p1_cracked_ton"
            },
            diesel_used:{
              $sum:"$diesel_used"
            }
          }
        },
        {
          $project:{
            diesel_used:1,
            total_crushed:1,
            _id:0
          }
        },
        {$limit:1},
      ]);

      this.total_qty_within_date = total_qty_processed.length > 0 ? total_qty_processed[0].total_crushed : 0
    }

    /**
     * Generates the List of all processed Items withing the Current filter Date
     */
    async computeAllTimeProcessedList() {

      const list = await DailyMetricModel.aggregate([
        {
          $match:{
            factory:this.factory
          }
        },
        {
          $group:{
            _id:{
              date:"$date",
              factory:"$factory"
            },
            total_qty:{
              $sum: this.factory === "f1" ? "$p2_in_ton":"$input_parameters.p1_cracked_ton"
            },
            total_pko_output_qty:{
              $sum: "$output_parameters.pko_recovered_ton"
            },
            total_pkc_output_qty:{
              $sum: "$output_parameters.pkc_recovered_ton"
            },
            total_p2_output_qty:{
              $sum: "$output_parameters.p2_recovered_ton"
            },
            total_shell_output_qty:{
              $sum: "$output_parameters.shell_recovered_ton"
            },
            total_energy_cost:{
              $sum: "$cost_of_diesel_used"
            },
          }
        },
        {
          $project:{
            date:"$_id.date",
            factory:"$_id.factory",
            total_qty:1,
            total_processed_qty:"$total_qty",
            total_pko_output_qty:1,
            total_pkc_output_qty:1,
            total_p2_output_qty:1,
            total_shell_output_qty:1,
            total_energy_cost:1,
            _id:0
          }
        },
        {
          $sort:{
            date:1
          }
        }
      ]);

      
      let total_qty = 0
      this.processed_all_time_list = list.map(processed=>{
        let total_energy_cost = processed.total_energy_cost
        total_energy_cost = getAmountAfterConversion(total_energy_cost,this.currency)
        total_qty += processed.total_qty

        return {
          ...processed,
          total_energy_cost
        }
      })

      this.processed_all_time_total_qty = total_qty
      
    }

    
    /**
     * Computes an accumulated production inventory dataset value
     */
    async computeAccumulatedProductionInventoryDataset(){
      await this.generateListWithinDate()

      let inventory_value = 0
      this.processed_list_within_range.forEach(process_item => {
        let {date,current_inventory} = process_item;
    
        let formatted_date = getDateLableUsingViewFormat(date,CONSTANT.DAY);
        inventory_value += current_inventory
        inventory_value = parseFloat(inventory_value.toFixed(2))
        
        this.processed_accumulated_inventory_within_range_dataset[formatted_date] = {
          ...process_item,
          inventory_value
        }
      });

      this.processed_accumulated_inventory_within_range_labels = Object.keys(this.processed_accumulated_inventory_within_range_dataset);
    }
    /**
     * Generates the list of Processed Items within Range
     */
    async generateListWithinDate() {
      await this.computeAllTimeProcessedItemCostList()
      this.processed_list_within_range = this.processed_all_time_cost_list.filter(process_item=> process_item.date >= this.startDate && process_item.date <= this.endDate)
      
      let total_rm_procurement_cost = 0 
      let total_energy_cost = 0
      let total_laterite_cost = 0
      let total_maintenance_cost = 0
      let total_direct_labour_cost = 0 
      let total_price = 0
      
      this.processed_list_within_range.forEach(process_item=>{

        let {
          date,
          total_price:price_total,
          rm_cost_total_price,
          total_energy_cost:total_energy_cost_price,
          total_laterite_cost:total_laterite_cost_price,
          total_maintenance_cost:total_maintenance_cost_price,
          total_direct_labour_cost:total_direct_labour_cost_price
        } = process_item

        total_rm_procurement_cost += rm_cost_total_price
        total_energy_cost += total_energy_cost_price
        total_laterite_cost += total_laterite_cost_price
        total_maintenance_cost += total_maintenance_cost_price
        total_direct_labour_cost += total_direct_labour_cost_price

        total_price += process_item.total_price
       

        
        const total_cost_price = rm_cost_total_price + total_energy_cost_price + total_laterite_cost_price + total_maintenance_cost_price + total_direct_labour_cost_price

        const formatted_graphview = getDateLableUsingViewFormat(date,this.graphView)
        
        if(this.processed_total_price_within_range_dataset[formatted_graphview] === undefined){
          this.processed_total_price_within_range_dataset[formatted_graphview] = 0
          this.processed_total_cost_of_good_manufactured_within_range_dataset[formatted_graphview] = 0
        }

        this.processed_total_price_within_range_dataset[formatted_graphview] += price_total
        this.processed_total_cost_of_good_manufactured_within_range_dataset[formatted_graphview] += total_cost_price

      })

      const total_cost_price = total_rm_procurement_cost + total_energy_cost + total_laterite_cost + total_maintenance_cost + total_direct_labour_cost

      this.processed_total_cost_of_good_manufactured_within_range = total_cost_price

      this.processed_total_cost_of_good_manufactured_within_range_component = {
        total_direct_labour_cost,
        total_maintenance_cost,
        total_laterite_cost,
        total_energy_cost,
        total_rm_procurement_cost
      }

      this.processed_rm_total_cost_price_within_range = total_cost_price
      this.processed_total_price_within_range = total_price
    }

    /**
     * Compute All time processed item cost list
     */
    async computeAllTimeProcessedItemCostList(){

      /**
       * Get the market price sets
       */
      const marketPriceService = new MarketPriceService(this.payload)
      await marketPriceService.computeAllTimeList()
      const market_prices = marketPriceService.market_price_all_time_list

      /** 
       * Get the list of all processed items
       */

      await this.computeAllTimeProcessedList()
      let processed_list = this.processed_all_time_list

      

      /** 
       * Get the list of supplied items
      */
      const supplyService = new SupplyService(this.payload)
      await supplyService.generateAllSupplyList();
      let list = supplyService.list


      /**
       * Get Maintenance Cost
      */
      const maintenanceCostService = new MaintenanceCostService(this.payload)
      await maintenanceCostService.computeAllTimeList()
      let maintenance_cost_list = maintenanceCostService.maintenance_cost_all_time_list


      const directLabourService = new DirectLabourCostService(this.payload)
      const lateriteService = new LateriteCostService(this.payload)
      

      /**
       * Iterate processed_list and set the targetted supply processed on date
       */

      let current_accumulated_qty  = 0

      this.processed_all_time_cost_list = processed_list.map(processed_item=>{
        const {total_qty} = processed_item
        current_accumulated_qty += total_qty

        let in_range = []
        let above_range = []
        let in_range_index = []
        let remaining_accumulated_qty = total_qty

        let inc = 0 // variable use to track incrementor values
        
        list.forEach( (supply,index) => {
          const {total_qty} = supply
          inc += total_qty

          /**
           * Get the items within scope
           * - maybe get their indexes which will be use to remove later
           */
          supply = {
            ...supply,
            accumulated_qty:inc
          }
          
          if(remaining_accumulated_qty >= inc){
            remaining_accumulated_qty -= inc

           
            in_range.push(supply)
            in_range_index.push(index)
          }else{
            above_range.push(supply)
          }

        })

        /**
         * Review to be sure that item in above_range does hold some value expected to be in_rage
         */

        if(above_range.length > 0){
          
          // get the first item in the above range list
          let first_index_in_above_range = above_range[0]
          const {accumulated_qty,unit_price} = first_index_in_above_range

          // create new object from removing the expected qty of item
          const ob = {
            ...first_index_in_above_range,
            total_price: unit_price * remaining_accumulated_qty,
            total_qty: remaining_accumulated_qty,
            accumulated_qty: remaining_accumulated_qty,
          }
          // update the in_range list with the outbound dataset
          in_range.push(ob)

          // Get the remaining qty that should go to the next item iteration
          const difference_qty = accumulated_qty - remaining_accumulated_qty
          // create new object after removing the qty for the in_range_qty

          above_range[0] = {
            ...first_index_in_above_range,
            total_price: unit_price* difference_qty,
            total_qty: difference_qty,
          }

          list = above_range
        }

        /** 
         * Iterate through the in_range to get the following
         * - total_qty
         * - total_price
        */

        let rm_cost_total_price = 0
        in_range.forEach(supply=>{
          rm_cost_total_price += supply.total_price
        })

        this.processed_total_cost_price +=rm_cost_total_price
        

        /**
        * Add Produced items economic value
        */

        const {date,total_pkc_output_qty,total_pko_output_qty,total_p2_output_qty,total_shell_output_qty,total_energy_cost} = processed_item

        let result_dataset = getProductionInventoryComputedDataset({
          market_price_dataset:market_prices,
          supply:{
            ...processed_item,
            total_pkc_produced:total_pkc_output_qty || 0,
            total_pko_produced:total_pko_output_qty || 0,
            total_p2_recovered:total_p2_output_qty || 0,
            total_shell_recovered_ton:total_shell_output_qty || 0
          },
          factory:this.factory,
          currency:this.currency
        })

        let {
          p2_inventory_value,
          pkc_inventory_value,
          pko_inventory_value,
          shell_inventory_value,
          avg_p2_market_price,
          current_inventory,
          avg_shell_market_price,
          shell_market_price_value,
        } = result_dataset

        p2_inventory_value= p2_inventory_value || 0
        shell_inventory_value= shell_inventory_value || 0
        pko_inventory_value= pko_inventory_value || 0
        pkc_inventory_value= pkc_inventory_value || 0
        
        let result = {
          ...processed_item,
          rm_cost_total_price,// replace this with rm_total_cost_price
          current_accumulated_qty,
          total_p2_economic_value:p2_inventory_value,
          total_shell_economic_value:shell_inventory_value,
          total_pko_economic_value:pko_inventory_value,
          total_pkc_economic_value:pkc_inventory_value,
          total_price:current_inventory,
          current_inventory,
          p2_market_price:avg_p2_market_price,
          shell_market_price:avg_shell_market_price,
          supplies:in_range
        }
        

        if(this.revenue_category === "production"){

          let shell_logistic_cost_price_per_ton = 0
          let total_shell_logistic_cost = 0

          

          if(this.is_revenue_with_logistics){
            if(shell_market_price_value){
              shell_logistic_cost_price_per_ton = shell_market_price_value.logistic_cost_per_ton
            }
            
            total_shell_logistic_cost = shell_logistic_cost_price_per_ton * total_shell_output_qty
            shell_inventory_value = (shell_inventory_value || 0 ) -  total_shell_logistic_cost // get the total revenue gotten from shell after removing the logistic cost
            current_inventory -= total_shell_logistic_cost
          }
          


          result = {
            ...result,
            total_price:current_inventory,
            current_inventory,
            total_shell_logistic_cost,
            shell_logistic_cost_price_per_ton,
          }
        }

        
        /**
         * Set new values for the following
         * 
         * - Set the P2_rm_cost_total_price
         * - Set the PNS_rm_cost_total_price
         * - Set the PKO_rm_cost_total_price
         * - Set the PKC_rm_cost_total_price
         * 
         */
        let P2_rm_cost_total_price = 0 
        if(current_inventory > 0 )  P2_rm_cost_total_price = p2_inventory_value/current_inventory * rm_cost_total_price
        let PNS_rm_cost_total_price = 0 
        if(current_inventory > 0 ) PNS_rm_cost_total_price = shell_inventory_value/current_inventory * rm_cost_total_price
        let PKO_rm_cost_total_price = 0 
        if(current_inventory > 0 ) PKO_rm_cost_total_price = pko_inventory_value/current_inventory * rm_cost_total_price
        let PKC_rm_cost_total_price = 0 
        if(current_inventory > 0 ) PKC_rm_cost_total_price = pkc_inventory_value/current_inventory * rm_cost_total_price

        // compute the direct labour
        const total_direct_labour_cost = directLabourService.total_daily_amount

        // compute the laterite cost
        const total_laterite_cost = lateriteService.getTotalAmountWithProcessQty(total_qty)

        // compute the laterite cost
        const maint_result = maintenance_cost_list.find(maintenance => {
          if(maintenance.date){
            return date.toISOString() === maintenance.date.toISOString()
          }
          
        })
        let total_maintenance_cost = 0
        try {
          total_maintenance_cost = maint_result.total_amount
        } catch (error) {}
        
        /**
         * Compute the cost of goods manufactured
         */
        let total_cogm = rm_cost_total_price + total_energy_cost + total_direct_labour_cost + total_laterite_cost + total_maintenance_cost


        let cogm_component = {
          total_energy_cost,
          total_laterite_cost,
          total_direct_labour_cost,
          total_maintenance_cost,
          total_rm_procurement_cost:rm_cost_total_price,
        }

        /**
         * Set new values for the following
         * 
         * - Set the P2_maintenance_cost_total_price
         * - Set the PNS_maintenance_cost_total_price
         * - Set the PKO_maintenance_cost_total_price
         * - Set the PKC_maintenance_cost_total_price
         * 
         */
        let P2_maintenance_cost_total_price = 0 
        if(current_inventory > 0 )  P2_maintenance_cost_total_price = p2_inventory_value/current_inventory * total_maintenance_cost
        let PNS_maintenance_cost_total_price = 0 
        if(current_inventory > 0 ) PNS_maintenance_cost_total_price = shell_inventory_value/current_inventory * total_maintenance_cost
        let PKO_maintenance_cost_total_price = 0 
        if(current_inventory > 0 ) PKO_maintenance_cost_total_price = pko_inventory_value/current_inventory * total_maintenance_cost
        let PKC_maintenance_cost_total_price = 0 
        if(current_inventory > 0 ) PKC_maintenance_cost_total_price = pkc_inventory_value/current_inventory * total_maintenance_cost


        /**
         * Set new values for the following
         * 
         * - Set the P2_energy_cost_total_price
         * - Set the PNS_energy_cost_total_price
         * - Set the PKO_energy_cost_total_price
         * - Set the PKC_energy_cost_total_price
         * 
         */
        let P2_energy_cost_total_price = 0 
        if(current_inventory > 0 )  P2_energy_cost_total_price = p2_inventory_value/current_inventory * total_energy_cost
        let PNS_energy_cost_total_price = 0 
        if(current_inventory > 0 ) PNS_energy_cost_total_price = shell_inventory_value/current_inventory * total_energy_cost
        let PKO_energy_cost_total_price = 0 
        if(current_inventory > 0 ) PKO_energy_cost_total_price = pko_inventory_value/current_inventory * total_energy_cost
        let PKC_energy_cost_total_price = 0 
        if(current_inventory > 0 ) PKC_energy_cost_total_price = pkc_inventory_value/current_inventory * total_energy_cost


        /**
         * Set new values for the following
         * 
         * - Set the P2_direct_labour_cost_total_price
         * - Set the PNS_direct_labour_cost_total_price
         * - Set the PKO_direct_labour_cost_total_price
         * - Set the PKC_direct_labour_cost_total_price
         * 
         */

        let P2_direct_labour_cost_total_price = 0 
        if(current_inventory > 0 )  P2_direct_labour_cost_total_price = p2_inventory_value/current_inventory * total_direct_labour_cost
        let PNS_direct_labour_cost_total_price = 0 
        if(current_inventory > 0 ) PNS_direct_labour_cost_total_price = shell_inventory_value/current_inventory * total_direct_labour_cost
        let PKO_direct_labour_cost_total_price = 0 
        if(current_inventory > 0 ) PKO_direct_labour_cost_total_price = pko_inventory_value/current_inventory * total_direct_labour_cost
        let PKC_direct_labour_cost_total_price = 0 
        if(current_inventory > 0 ) PKC_direct_labour_cost_total_price = pkc_inventory_value/current_inventory * total_direct_labour_cost



        /**
         * Set new values for the following
         * 
         * - Set the P2_laterite_cost_total_price
         * - Set the PNS_laterite_cost_total_price
         * - Set the PKO_laterite_cost_total_price
         * - Set the PKC_laterite_cost_total_price
         * 
         */

        let P2_laterite_cost_total_price = 0 
        if(current_inventory > 0 )  P2_laterite_cost_total_price = p2_inventory_value/current_inventory * total_laterite_cost
        let PNS_laterite_cost_total_price = 0 
        if(current_inventory > 0 ) PNS_laterite_cost_total_price = shell_inventory_value/current_inventory * total_laterite_cost
        let PKO_laterite_cost_total_price = 0 
        if(current_inventory > 0 ) PKO_laterite_cost_total_price = pko_inventory_value/current_inventory * total_laterite_cost
        let PKC_laterite_cost_total_price = 0 
        if(current_inventory > 0 ) PKC_laterite_cost_total_price = pkc_inventory_value/current_inventory * total_laterite_cost

        result = {
          ...result,
          total_direct_labour_cost,
          total_laterite_cost,
          total_maintenance_cost,
          total_cogm,
          cogm_component,

          // rm cost
          P2_rm_cost_total_price,
          PNS_rm_cost_total_price,
          PKO_rm_cost_total_price,
          PKC_rm_cost_total_price,

          // maintenance cost
          P2_maintenance_cost_total_price,
          PNS_maintenance_cost_total_price,
          PKO_maintenance_cost_total_price,
          PKC_maintenance_cost_total_price,

          // energy cost
          P2_energy_cost_total_price,
          PNS_energy_cost_total_price,
          PKO_energy_cost_total_price,
          PKC_energy_cost_total_price,

          // direct labour cost
          P2_direct_labour_cost_total_price,
          PNS_direct_labour_cost_total_price,
          PKO_direct_labour_cost_total_price,
          PKC_direct_labour_cost_total_price,

          // laterite cost
          P2_laterite_cost_total_price,
          PNS_laterite_cost_total_price,
          PKO_laterite_cost_total_price,
          PKC_laterite_cost_total_price,
        }


        return result
      })
    }


    async computeProcessList() {
      this.list = await DailyMetricModel.aggregate([
        {
          $match:{
            factory:this.factory,
            date:{
              $gte:new Date(this.startDate),
              $lte:new Date(this.endDate)
            },
          }
        },
        {
          $group:{
            _id:{
              date:"$date"
            },
          }
        },
        {
          $project:{
            date:"$_id.date",
            _id:0
          }
        },
        {
          $sort:{
            date:1,
          }
        },
      ]);
    }

    async computeProcessQty() {
      const result = await DailyMetricModel.aggregate([
        {
          $match:{
            factory:this.factory,
            date:{
              $gte:new Date(this.startDate),
              $lte:new Date(this.endDate)
            },
          }
        },
        {
          $group:{
            _id:null,
            total_processed:{
              $sum:"$input_parameters.p1_cracked_ton"
            }
          }
        },
        {
          $project:{
            total_processed:1,
            _id:0
          }
        },
      ]);

      this.processed_qty = result.length > 0 ? result[0].total_processed : 0
    }

    async computeNoOfUniqueDateInDateRange() {
      const list = await DailyMetricModel.aggregate([
        {
          $match:{
            factory:this.factory,
            date:{
              $gte:new Date(this.startDate),
              $lte:new Date(this.endDate)
            },
          }
        },
        {
          $group:{
            _id:{
              date:"$date"
            },
          }
        },
        {
          $project:{
            date:"$_id.date",
            _id:0
          }
        },
        {
          $group:{
            _id:null,
            unique_days:{
              $sum:1
            },
          }
        },
      ]);

      this.no_of_unique_days_in_date_range = list.length > 0 ? list[0].unique_days : 0
    }
}

module.exports = ProcessService