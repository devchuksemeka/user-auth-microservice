const {getDateLableUsingViewFormat,CONSTANT, getAmountAfterConversion} = require("../../index")
const ProcessService = require('../Process/ProcessService');
const BaseService = require('../BaseService');
const SaleService = require('../Sale/SaleService');

class InventoryService extends BaseService{

    constructor(payload){
      super(payload)
      this.processService = null
      this.saleService = null

       // process attributes
       this.process_all_time_inventory_reconciliation = []
       this.process_all_time_inventory_reconciliation_component = {}

      this.process_within_range_inventory_reconciliation = []
      this.process_within_range_inventory_stock = {}


      // process & sales
      this.process_sales_all_time_inventory_reconciliation = []
      this.process_sales_all_time_inventory_reconciliation_component = {}

      this.process_sales_within_range_inventory_reconciliation = []
      this.process_sales_within_range_inventory_stock = {}
    }

     /**
     * Compute the list of Inventory within range
     */
    async computeProcessedListWithinRange(){
      await this.computeAllTimeProcessedList()

      // get list whose date is gte start_date & lte end_date
      this.process_within_range_inventory_reconciliation = this.process_all_time_inventory_reconciliation.filter(processed => {
        return processed.date >= this.startDate && processed.date <= this.endDate
      })

      const inventory_list = this.process_within_range_inventory_reconciliation
      
      // set the opening values
      this.process_within_range_inventory_stock = {
        open : inventory_list[0],
        close : inventory_list[inventory_list.length -1],
      }

  }

    /**
     * Compute the list of Inventory within range
     */
    async computeListWithinRange(){
        await this.computeAllTimeList()

        // get list whose date is gte start_date & lte end_date
        this.process_sales_within_range_inventory_reconciliation = this.process_sales_all_time_inventory_reconciliation.filter(processed => {
          return processed.date >= this.startDate && processed.date <= this.endDate
        })

        const inventory_list = this.process_sales_within_range_inventory_reconciliation
        
        // set the opening values
        this.process_sales_within_range_inventory_stock = {
          open : inventory_list[0],
          close : inventory_list[inventory_list.length -1],
        }

    }

    async computeAllTimeList(){

      // Compute the process within range
      await this.computeProcessAllTimeList()

      // Compute the sales within range
      await this.computeSaleAllimeList()

      await this.computeAllTimeProcessSalesInventory()

    }

    /**
     * compute the list of all time processed list
     */
    async computeAllTimeProcessedList(){

      // Compute the process within range
      await this.computeProcessAllTimeList()

      // Compute the sales within range
      await this.computeSaleAllimeList()

      await this.computeAllTimeProcessedInventory()

    }

    /**
     * Compute the processes all time list of items 
     */
    async computeProcessAllTimeList(){
      this.processService = new ProcessService(this.payload)
      await this.processService.computeAllTimeProcessedItemCostList()
      // await this.processService.computeAllTimeProcessedList()
    }

    /**
     * Compute the sales all time list of items
    */
    async computeSaleAllimeList(){
      // Compute the sales within range
      this.saleService = new SaleService(this.payload)
      await this.saleService.computeAllTimeList()
    }

    /**
     * Compute all time processed inventory
     */
    async computeAllTimeProcessedInventory(){

      const {processed_all_time_list} = this.processService

      if(this.factory === CONSTANT.FACTORIES.C1){
         // iterate through the list of all processess
        this.computeAllTimeP2ProcessedInventory()
        this.computeAllTimePNSProcessedInventory()

      }

      const P2_inventories = this.process_all_time_inventory_reconciliation_component[this.p2_product.name]
      const PNS_inventories = this.process_all_time_inventory_reconciliation_component[this.pns_product.name]
     

      // get the process_sales_all_time_inventory_reconciliation_component
      processed_all_time_list.forEach(process_item=>{
        const {date} = process_item
        // get P2 inventories
        const p2_res = P2_inventories.find(inventory=> {
          if(date) return date.toISOString() === inventory.date.toISOString()
        })
        // get PNS inventories
        const pns_res = PNS_inventories.find(inventory=> {
          if(date) return date.toISOString() === inventory.date.toISOString()
        })


        let start_inventory_value = 0
        let processed_inventory_value = 0
        let close_inventory_value = 0

        if(p2_res){
          const {
            start_inventory_value:start_p2_inventory_value,
            processed_inventory_value:processed_p2_inventory_value,
            close_inventory_value:close_p2_inventory_value
          } = p2_res

          start_inventory_value += start_p2_inventory_value
          processed_inventory_value += processed_p2_inventory_value
          close_inventory_value += close_p2_inventory_value
        }

        if(pns_res){
          const {
            start_inventory_value:start_pns_inventory_value,
            processed_inventory_value:processed_pns_inventory_value,
            close_inventory_value:close_pns_inventory_value
          } = pns_res

          start_inventory_value += start_pns_inventory_value
          processed_inventory_value += processed_pns_inventory_value
          close_inventory_value += close_pns_inventory_value
        }

        this.process_all_time_inventory_reconciliation.push({
          date,
          start_inventory_value,
          processed_inventory_value,
          close_inventory_value,
          products:{
            P2:p2_res,
            PNS:pns_res,
          }
        })
      })

    }

    /**
     * Compute all time process & sale inventory
     */
    async computeAllTimeProcessSalesInventory(){

      const {processed_all_time_list} = this.processService

      if(this.factory === CONSTANT.FACTORIES.C1){
         // iterate through the list of all processess
        this.computeAllTimeP2ProcessSalesInventory()
        this.computeAllTimePNSProcessSalesInventory()

      }

      const P2_inventories = this.process_sales_all_time_inventory_reconciliation_component[this.p2_product.name]
      const PNS_inventories = this.process_sales_all_time_inventory_reconciliation_component[this.pns_product.name]
     

      // get the process_sales_all_time_inventory_reconciliation_component
      processed_all_time_list.forEach(process_item=>{
        const {date} = process_item
        // get P2 inventories
        const p2_res = P2_inventories.find(inventory=> {
          if(date) return date.toISOString() === inventory.date.toISOString()
        })
        // get PNS inventories
        const pns_res = PNS_inventories.find(inventory=> {
          if(date) return date.toISOString() === inventory.date.toISOString()
        })


        let start_inventory_value = 0
        let sold_inventory_value = 0
        let close_inventory_value = 0

        if(p2_res){
          const {
            start_inventory_value:start_p2_inventory_value,
            sold_inventory_value:sold_p2_inventory_value,
            close_inventory_value:close_p2_inventory_value
          } = p2_res
          start_inventory_value += start_p2_inventory_value
          sold_inventory_value += sold_p2_inventory_value
          close_inventory_value += close_p2_inventory_value
        }

        if(pns_res){
          const {
            start_inventory_value:start_pns_inventory_value,
            sold_inventory_value:sold_pns_inventory_value,
            close_inventory_value:close_pns_inventory_value
          } = pns_res

          start_inventory_value += start_pns_inventory_value
          sold_inventory_value += sold_pns_inventory_value
          close_inventory_value += close_pns_inventory_value
        }

        this.process_sales_all_time_inventory_reconciliation.push({
          date,
          start_inventory_value,
          sold_inventory_value,
          close_inventory_value,
          products:{
            P2:p2_res,
            PNS:pns_res,
          }
        })
      })

    }

    /**
     * Compute all time p2 process & sales inventory
     */
    async computeAllTimeP2ProcessSalesInventory(){

      const {processed_all_time_list} = this.processService

      const {sales_list_all_time_components} = this.saleService
      const sales = sales_list_all_time_components.P2

      

      if( this.process_sales_all_time_inventory_reconciliation_component[this.p2_product.name] === undefined) {
        this.process_sales_all_time_inventory_reconciliation_component[this.p2_product.name] = []
      }

      // iterate through the list of all processess
      let start_qty = 0 
      let start_inventory_value = 0 
      processed_all_time_list.forEach((process_item,index)=>{

        const {date,total_p2_output_qty} = process_item
        const produced_qty = total_p2_output_qty
        let sold_qty = 0
        let sold_inventory_value = 0
        // get sales done this day
        const sale = sales.find(sale_item => {
          return date.toISOString() === sale_item.date.toISOString()
        })

        if(sale){
          const {total_quantity,price_total} = sale
          sold_qty = total_quantity
          sold_inventory_value = price_total
        }

        const close_qty = start_qty + produced_qty - sold_qty
        const close_inventory_value = start_inventory_value + sold_inventory_value

        

        this.process_sales_all_time_inventory_reconciliation_component[this.p2_product.name].push({
          date,
          start_qty,
          start_inventory_value,
          produced_qty,
          sold_qty,
          sold_inventory_value,
          close_qty,
          close_inventory_value
        })

        start_qty = close_qty
        start_inventory_value = close_inventory_value

      })



    }

    /**
     * Compute all time pns process & sales inventory
     */
    async computeAllTimePNSProcessSalesInventory(){

      const {processed_all_time_list} = this.processService

      const {sales_list_all_time_components} = this.saleService
      const sales = sales_list_all_time_components.PNS

    

      if( this.process_sales_all_time_inventory_reconciliation_component[this.pns_product.name] === undefined) {
        this.process_sales_all_time_inventory_reconciliation_component[this.pns_product.name] = []
      }

         // iterate through the list of all processess
      let start_qty = 0
      let start_inventory_value = 0 


      processed_all_time_list.map((process_item,index)=>{

        const {date,total_shell_output_qty} = process_item
        const produced_qty = total_shell_output_qty
        let sold_qty = 0
        let sold_inventory_value = 0
        // get sales done this day
        const sale = sales.find(sale_item => {
          return date.toISOString() === sale_item.date.toISOString()
        })

        if(sale){
          const {total_quantity,price_total} = sale
          sold_qty = total_quantity
          sold_inventory_value = price_total
        }

        const close_qty = start_qty + produced_qty - sold_qty
        const close_inventory_value = start_inventory_value + sold_inventory_value

        this.process_sales_all_time_inventory_reconciliation_component[this.pns_product.name].push({
          date,
          start_qty,
          start_inventory_value,
          produced_qty,
          sold_qty,
          sold_inventory_value,
          close_qty,
          close_inventory_value
        })

        start_qty = close_qty
        start_inventory_value = close_inventory_value

      })
    }

        /**
     * Compute all time p2 processed inventory
     */
    async computeAllTimeP2ProcessedInventory(){

      const {processed_all_time_cost_list} = this.processService

      const {sales_list_all_time_components} = this.saleService
      const sales = sales_list_all_time_components.P2

      

      if( this.process_all_time_inventory_reconciliation_component[this.p2_product.name] === undefined) {
        this.process_all_time_inventory_reconciliation_component[this.p2_product.name] = []
      }

      // iterate through the list of all processess
      let start_qty = 0 
      let start_inventory_value = 0 
      processed_all_time_cost_list.forEach((process_item,index)=>{

        const {date,total_p2_output_qty,total_p2_economic_value} = process_item
        const produced_qty = total_p2_output_qty
        let sold_qty = 0
        let processed_inventory_value = total_p2_economic_value
        // get sales done this day
        const sale = sales.find(sale_item => {
          return date.toISOString() === sale_item.date.toISOString()
        })

        if(sale){
          const {total_quantity} = sale
          sold_qty = total_quantity
        }

        const close_qty = start_qty + produced_qty - sold_qty
        
        /**
         * Get the current start inventory value
         * Divide it by the open qty to get unit inventory value
         * subtract the inventory value from the start inventory value = current inventory
         */

        let current_inventory_value_per_ton = 0

        if(start_qty > 0) current_inventory_value_per_ton = start_inventory_value / start_qty
        // if(Math.abs(start_qty) > 0) current_inventory_value_per_ton = start_inventory_value / start_qty
     

        const current_inventory_after_sales = (start_qty - sold_qty) * current_inventory_value_per_ton

        const close_inventory_value = current_inventory_after_sales + processed_inventory_value

        

        this.process_all_time_inventory_reconciliation_component[this.p2_product.name].push({
          date,
          start_qty,
          start_inventory_value,
          produced_qty,
          sold_qty,
          processed_inventory_value,
          close_qty,
          close_inventory_value
        })

        start_qty = close_qty
        start_inventory_value = close_inventory_value

      })



    }

    /**
     * Compute all time pns processed inventory
     */
    async computeAllTimePNSProcessedInventory(){

      const {processed_all_time_cost_list,} = this.processService

      const {sales_list_all_time_components} = this.saleService
      const sales = sales_list_all_time_components.PNS

    

      if(this.process_all_time_inventory_reconciliation_component[this.pns_product.name] === undefined) {
        this.process_all_time_inventory_reconciliation_component[this.pns_product.name] = []
      }

         // iterate through the list of all processess
      let start_qty = 0
      let start_inventory_value = 0 


      processed_all_time_cost_list.map((process_item,index)=>{

        const {date,total_shell_output_qty,total_shell_economic_value} = process_item
        const produced_qty = total_shell_output_qty
        let sold_qty = 0
        let processed_inventory_value = total_shell_economic_value
        // get sales done this day
        const sale = sales.find(sale_item => {
          return date.toISOString() === sale_item.date.toISOString()
        })

        if(sale){
          const {total_quantity} = sale
          sold_qty = total_quantity
        }

        const close_qty = start_qty + produced_qty - sold_qty
         /**
         * Get the current start inventory value
         * Divide it by the open qty to get unit inventory value
         * subtract the inventory value from the start inventory value = current inventory
         */

        let current_inventory_value_per_ton = 0


        if(start_qty > 0) current_inventory_value_per_ton = start_inventory_value / start_qty
        // if(Math.abs(start_qty) > 0) current_inventory_value_per_ton = start_inventory_value / start_qty
     

        const current_inventory_after_sales = (start_qty - sold_qty) * current_inventory_value_per_ton

        const close_inventory_value = current_inventory_after_sales + processed_inventory_value

        this.process_all_time_inventory_reconciliation_component[this.pns_product.name].push({
          date,
          start_qty,
          start_inventory_value,
          produced_qty,
          sold_qty,
          processed_inventory_value,
          close_qty,
          close_inventory_value
        })

        start_qty = close_qty
        start_inventory_value = close_inventory_value

      })
    }
}


module.exports = InventoryService