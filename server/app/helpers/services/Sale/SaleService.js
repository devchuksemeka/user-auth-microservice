const SaleModel = require('../../../models/Sale')
const {getDateLableUsingViewFormat,CONSTANT, getAmountAfterConversion} = require("../../index")
const moment = require('moment')
const {grouping} = require("../../mongoose/groupings");
const {project} = require("../../mongoose/projects");
const {sort} = require("../../mongoose/sorts");
const ProcessService = require('../Process/ProcessService');
const BaseService = require('../BaseService');

class SaleService extends BaseService{

    constructor(payload){
      super(payload)
      const {product} = payload

      this.product = product ? product.toUpperCase() : ""
      this.list = []
      this.product_types = []

      /**
       * All time sales properties
       */
      this.processed_all_time_cost_list = []

      this.sales_all_time_process_costing_list = []
      this.sales_all_time_process_costing_list_components = {}
      this.sales_all_time_total_process_cost= 0
      this.sales_all_time_total_process_cost_components = {}

      /**
       * All time sales properties
       */
      this.sales_list_all_time_unique_date = []
      this.sales_list_all_time_components = {}
      this.sales_list_all_time = []
      this.sales_total_price_all_time = 0
      this.sales_total_price_all_time_components = {}
      this.sales_total_qty_all_time = 0
      this.sales_total_qty_all_time_components = {}
      this.sales_logistics_all_time_components = {}

      /**
      * Attribute helps to get what has been sold within a specified period
      */
      this.sales_list_within_range = []
      this.sales_total_qty_within_range = 0
      this.sales_total_price_within_range = 0
      this.sales_total_actual_price_within_range = 0 // after removing logistics
      this.sales_total_logistics_within_range = 0
      this.sales_total_cost_price_within_range = 0
      this.sales_total_cogm_component_within_range = {
        total_maintenance_cost:0,
        total_energy_cost:0,
        total_direct_labour_cost:0,
        total_laterite_cost:0,
        total_rm_procurement_cost:0,
      }
      this.sales_total_cogm_within_range = 0
      this.sales_total_price_within_range_dataset = {}
      this.sales_rm_total_cost_price_within_range_dataset = {}
      this.sales_total_cogm_within_range_dataset = {}

      /**
      * Attribute helps to get what has been sold before a specified period
      */
      this.sales_list_before_range = []
      this.sales_total_qty_before_range = 0
      this.sales_total_price_before_range = 0
    }


    /**
     * Compute the list of all sales within specified date range
     * 
     * - Set list_within_range
     * - Set sales_total_price_within_range
     * - Set sales_total_qty_within_range
     */
    async computeListWithinRange(){
      await this.computeAllTimeSalesProcessCostingList()
      const list = this.sales_all_time_process_costing_list

      /**
       * Get the list of sales within range
       */

      this.sales_list_within_range = list.filter(sale=> sale.date >= this.startDate && sale.date <= this.endDate)
    //  console.log("sales_list_within_range",this.sales_list_within_range)
      let rm_total_cost_price = 0 

      let acc_total_rm_procurement_cost = 0 
      let acc_total_energy_cost = 0 
      let acc_total_laterite_cost = 0 
      let acc_total_direct_labour_cost = 0 
      let acc_total_maintenance_cost = 0 
      let acc_total_cogm = 0 
      let acc_total_actual_sales_price = 0 
      let acc_total_sales_logistics = 0 
      let acc_sales_logistics = {
        total_sale_logistics:0,
        total_toll_logistics:0,
        total_truck_repair_logistics:0,
      }

       let total_price = 0 

       
       
       this.sales_list_within_range.forEach(sale=>{
        const {date,
          total_rm_procurement_cost,total_energy_cost,total_laterite_cost,total_direct_labour_cost,total_maintenance_cost,
          total_cogm,
          price_total,total_actual_sales_price,
          sale_total_logistics,sale_logistics
        } = sale

        acc_total_rm_procurement_cost += total_rm_procurement_cost || 0
        acc_total_energy_cost += total_energy_cost || 0
        acc_total_laterite_cost += total_laterite_cost || 0
        acc_total_direct_labour_cost += total_direct_labour_cost || 0
        acc_total_maintenance_cost += total_maintenance_cost || 0
        acc_total_cogm += total_cogm
        acc_total_sales_logistics += sale_total_logistics || 0
        acc_total_actual_sales_price += total_actual_sales_price || 0
        

        const total_cost_goods_manufactured =  total_rm_procurement_cost + total_energy_cost + total_laterite_cost + total_direct_labour_cost + total_maintenance_cost

        const formatted_graphview = getDateLableUsingViewFormat(date,this.graphView)
        
        if(this.sales_total_price_within_range_dataset[formatted_graphview] === undefined){
          this.sales_total_price_within_range_dataset[formatted_graphview] = 0
          this.sales_total_cogm_within_range_dataset[formatted_graphview] = 0
        }

        this.sales_total_price_within_range_dataset[formatted_graphview] += price_total
        this.sales_total_cogm_within_range_dataset[formatted_graphview] += total_cost_goods_manufactured

        
        total_price += price_total

       })

       this.sales_total_cogm_component_within_range.total_rm_procurement_cost = acc_total_rm_procurement_cost
       this.sales_total_cogm_component_within_range.total_energy_cost = acc_total_energy_cost
       this.sales_total_cogm_component_within_range.total_laterite_cost = acc_total_laterite_cost
       this.sales_total_cogm_component_within_range.total_direct_labour_cost = acc_total_direct_labour_cost
       this.sales_total_cogm_component_within_range.total_maintenance_cost = acc_total_maintenance_cost

       this.sales_total_cogm_within_range = acc_total_cogm
       this.sales_total_price_within_range = total_price
       this.sales_total_logistics_within_range = acc_total_sales_logistics
       this.sales_total_actual_price_within_range = acc_total_actual_sales_price
       
    }

   

    /**
     * Compute the unique date for sales
     */
    async computeAllTimeUniqueDateList(){
      this.sales_list_all_time_unique_date = await SaleModel.aggregate([
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
            date:1
          }
        }
      ])

    }

    /**
     * Compute the list of all sales filter by products
     */
    async computeAllTimeListProductFiltering(payload=this.p2_product){

      let {name,types} = payload
      let match = {
        factory:this.factory,
        product:{
          $in:types
        },
      }

      const list = await SaleModel.aggregate([
        {
          $match:match
        },
        {
          $group:{
            _id:{
              date:"$date"
            },
            total_quantity:{
              $sum:"$quantity_in_ton"
            },
            price_total:{
              $sum:"$price_total"
            },
            total_sale_logistics:{
              $sum:"$logistics.sale_logistics"
            },
            total_toll_logistics:{
              $sum:"$logistics.toll_logistics"
            },
            total_truck_repair_logistics:{
              $sum:"$logistics.truck_repair_logistics"
            },
          }
        },
        {
          $project:{
            date:"$_id.date",
            total_quantity:1,
            price_total:1,
            total_sale_logistics:1,
            total_toll_logistics:1,
            total_truck_repair_logistics:1,
            _id:0
          }
        },
        {
          $sort:{
            date:1
          }
        }
      ])

      this.sales_list_all_time_components[name] = []
      let total_price = 0
      let acc_total_quantity = 0
      let acc_total_sale_logistics = 0
      let acc_total_toll_logistics = 0
      let acc_total_truck_repair_logistics = 0

      list.forEach(sale=>{
        let {price_total,total_quantity,total_sale_logistics,total_toll_logistics,total_truck_repair_logistics} = sale
        price_total = getAmountAfterConversion(price_total,this.currency)

        total_price += price_total
        acc_total_quantity += total_quantity

        if(this.is_revenue_with_logistics){
          total_sale_logistics =  getAmountAfterConversion(total_sale_logistics,this.currency)
          total_toll_logistics =  getAmountAfterConversion(total_toll_logistics,this.currency)
          total_truck_repair_logistics =  getAmountAfterConversion(total_truck_repair_logistics,this.currency)

          acc_total_sale_logistics +=  total_sale_logistics
          acc_total_toll_logistics +=  total_toll_logistics
          acc_total_truck_repair_logistics +=  total_truck_repair_logistics
        }else{
          total_sale_logistics =  0
          total_toll_logistics =  0
          total_truck_repair_logistics =  0

          acc_total_sale_logistics +=  total_sale_logistics
          acc_total_toll_logistics +=  total_toll_logistics
          acc_total_truck_repair_logistics +=  total_truck_repair_logistics
        }
        
        this.sales_list_all_time_components[name].push({
          ...sale,
          price_total,
          sale_total_logistics: total_sale_logistics + total_toll_logistics + total_truck_repair_logistics,

          sale_logistics:{
            total_sale_logistics,
            total_toll_logistics,
            total_truck_repair_logistics
          }
        })

      })

      

      this.sales_total_price_all_time_components[name] = total_price
      this.sales_total_qty_all_time_components[name] = acc_total_quantity

      this.sales_logistics_all_time_components[name] = {
        acc_total_sale_logistics,
        acc_total_toll_logistics,
        acc_total_truck_repair_logistics
      }
    }

     /**
     * Compute the list of all sales
     * 
     * - Set sales_list_all_time
     * - Set sales_total_qty_all_time
     * - Set sales_total_price_all_time
     */
    async computeAllTimeList(){
      if(this.factory === CONSTANT.FACTORIES.F1){

      }

      else if(this.factory === CONSTANT.FACTORIES.C1){
        await this.computeAllTimeP2List()
        await this.computeAllTimePNSList()
      }
    }

    /**
     * Compute all time sales of P2 product
     */
    async computeAllTimeP2List(){
      await this.computeAllTimeListProductFiltering(this.p2_product)
    }

    /**
     * Compute all time sales of shell product
     */
    async computeAllTimePNSList(){
      await this.computeAllTimeListProductFiltering(this.pns_product)
    }

    /**
     * Compute the list of sales together with the process iteration and costing
    */
    async computeAllTimeSalesProcessCostingList(){
      /**
       * Get the complete list of all process cost listing
       */
      const processService = new ProcessService(this.payload)
      await processService.computeAllTimeProcessedItemCostList()
      this.processed_all_time_cost_list = processService.processed_all_time_cost_list

       /**
        * Get the list of all Sales
        */
       await this.computeAllTimeList()

      /**
      * Compute a proper computation breakdown of sales: RM cost
      */
       if(this.factory === CONSTANT.FACTORIES.C1){
        this.computeAllTimeSalesProcessCostingListByProduct(this.p2_product)
        this.computeAllTimeSalesProcessCostingListByProduct(this.pns_product)
       }
       if(this.factory === CONSTANT.FACTORIES.F1){
       
       }

       // get the keys in the sales_all_time_process_costing_list_components
       const sales_component_keys = Object.keys(this.sales_all_time_process_costing_list_components)

       /**
        * Process the sales_all_time_process_costing_list using sales_all_time_process_costing_list_components datasets value
        */

       await this.computeAllTimeUniqueDateList()
       /**
        * Iterate through the sales_list_all_time_unique_dates 
        * 
        * Using the date compare on the sales_all_time_process_costing_list_components to get the actual sale
       */
       const sales_all_time_list = []
       this.sales_list_all_time_unique_date.forEach((sale,sale_index)=>{
         // get item in index
        let sale_data = {
          ...sale,
          price_total : 0,
          total_actual_sales_price : 0,
          sale_total_logistics : 0,
          sale_logistics : {
            total_sale_logistics:0,
            total_toll_logistics:0,
            total_truck_repair_logistics:0,
          },
          total_cogm : 0,
          total_rm_procurement_cost : 0,
          total_energy_cost : 0,
          total_laterite_cost : 0,
          total_direct_labour_cost : 0,
          total_maintenance_cost : 0,
          products:{},
          
        }

        sales_component_keys.forEach(product_name=>{
          const result = this.sales_all_time_process_costing_list_components[product_name].find(computed_sale_process => sale.date.toISOString() === computed_sale_process.date.toISOString())
          
          
          try {

            sale_data.products[product_name] = result
            sale_data.price_total += result.price_total
            sale_data.sale_total_logistics += result.sale_total_logistics
            sale_data.sale_logistics.total_sale_logistics += result.sale_logistics.total_sale_logistics
            sale_data.sale_logistics.total_toll_logistics += result.sale_logistics.total_toll_logistics
            sale_data.sale_logistics.total_truck_repair_logistics += result.sale_logistics.total_truck_repair_logistics

            sale_data.total_cogm += result.total_cogm
            sale_data.total_rm_procurement_cost += result.cogm_component.total_rm_procurement_cost
            sale_data.total_energy_cost += result.cogm_component.total_energy_cost
            sale_data.total_laterite_cost += result.cogm_component.total_laterite_cost
            sale_data.total_direct_labour_cost += result.cogm_component.total_direct_labour_cost
            sale_data.total_maintenance_cost += result.cogm_component.total_maintenance_cost

            sale_data.total_actual_sales_price += result.price_total - result.sale_total_logistics
           
           
          } catch (error) {
            // console.log("error",error)
          }
         
        })

        // push to all_time_list array
        sales_all_time_list.push(sale_data)
       })

       this.sales_all_time_process_costing_list = sales_all_time_list
       
    }

    /**
     * Compute products all time sales processing costing list
    */

    computeAllTimeSalesProcessCostingListByProduct(payload){
      const {name,type} = payload
      /**
      * Get the sales list for product
      */
      const all_time_sale_list = this.sales_list_all_time_components[name]
      let all_time_process_list = this.processed_all_time_cost_list
      /**
      * Iterate through the sales list to Process cost list
      */

      let current_accumulated_qty  = 0

      
      // breakdown for P2 output
      const result = all_time_sale_list.map((sale_item,sales_index)=>{
        const {total_quantity} = sale_item
        current_accumulated_qty += total_quantity

        let in_range = []
        let above_range = []
        let remaining_accumulated_qty = total_quantity
        let stop_populating_in_range = false

        let inc = 0 // variable use to track incrementor values

        if(name === this.p2_product.name){
          all_time_process_list.forEach( (processed_item) => {
            const {total_p2_output_qty} = processed_item
           
            inc += total_p2_output_qty || 0
            
  
            // Set production economic value item proce
            /**
             * Get the items within scope
             * - maybe get their indexes which will be use to remove later
             */
            processed_item = {
              ...processed_item,
              accumulated_qty:inc,
              supplies:undefined,
            }
  
            if(!stop_populating_in_range && remaining_accumulated_qty >= total_p2_output_qty){
              
              in_range.push(processed_item)
              
              remaining_accumulated_qty -= total_p2_output_qty
            }else{
              stop_populating_in_range = true
              above_range.push(processed_item)
            }
  
          })
  
          /**
           * Review to be sure that item in above_range does hold some value expected to be in_range
           */
  
          if(above_range.length > 0){
            
            // get the first item in the above range list
            let first_index_in_above_range = above_range[0]
            let {
              accumulated_qty,
              P2_rm_cost_total_price,
              P2_maintenance_cost_total_price,
              P2_energy_cost_total_price,
              P2_direct_labour_cost_total_price,
              P2_laterite_cost_total_price,
              total_p2_output_qty
            } = first_index_in_above_range
  
            const p2_rm_cost_unit_price = P2_rm_cost_total_price / (total_p2_output_qty || 0)
            const p2_maintenance_cost_unit_price = P2_maintenance_cost_total_price / (total_p2_output_qty || 0)
            const p2_energy_cost_unit_price = P2_energy_cost_total_price / (total_p2_output_qty || 0)
            const p2_direct_labour_cost_unit_price = P2_direct_labour_cost_total_price / (total_p2_output_qty || 0)
            const p2_laterite_cost_unit_price = P2_laterite_cost_total_price / (total_p2_output_qty || 0)
  
  
            // create new object from removing the expected qty of item
            const ob = {
              ...first_index_in_above_range,
              P2_rm_cost_total_price: p2_rm_cost_unit_price * remaining_accumulated_qty,
              P2_maintenance_cost_total_price:p2_maintenance_cost_unit_price * remaining_accumulated_qty,
              P2_energy_cost_total_price:p2_energy_cost_unit_price * remaining_accumulated_qty,
              P2_direct_labour_cost_total_price:p2_direct_labour_cost_unit_price * remaining_accumulated_qty,
              P2_laterite_cost_total_price:p2_laterite_cost_unit_price * remaining_accumulated_qty,
              total_p2_output_qty: remaining_accumulated_qty,
              accumulated_qty: remaining_accumulated_qty,
              supplies:undefined,
            }
  
            // update the in_range list with the outbound dataset
            in_range.push(ob)
  
  
            // Get the remaining qty that should go to the next item iteration
            const difference_qty = accumulated_qty - remaining_accumulated_qty
            // create new object after removing the qty for the in_range_qty
  
            above_range[0] = {
              ...first_index_in_above_range,
              P2_rm_cost_total_price: p2_rm_cost_unit_price* difference_qty,

              P2_maintenance_cost_total_price:p2_maintenance_cost_unit_price * difference_qty,
              P2_energy_cost_total_price:p2_energy_cost_unit_price * difference_qty,
              P2_direct_labour_cost_total_price:p2_direct_labour_cost_unit_price * difference_qty,
              P2_laterite_cost_total_price:p2_laterite_cost_unit_price * difference_qty,

              total_p2_output_qty: difference_qty,
              supplies:undefined,
            }
  
            all_time_process_list = above_range
          }
  
          /** 
           * Iterate through the in_range to get the following
           * - total_qty
           * - total_price
           */
          
          let P2_rm_cost_total_price = 0
          let P2_maintenance_cost_total_price = 0
          let P2_energy_cost_total_price = 0
          let P2_direct_labour_cost_total_price = 0
          let P2_laterite_cost_total_price = 0

          in_range.forEach(processed_item=>{
            P2_rm_cost_total_price += processed_item.P2_rm_cost_total_price
            P2_maintenance_cost_total_price += processed_item.P2_maintenance_cost_total_price
            P2_energy_cost_total_price += processed_item.P2_energy_cost_total_price
            P2_direct_labour_cost_total_price += processed_item.P2_direct_labour_cost_total_price
            P2_laterite_cost_total_price += processed_item.P2_laterite_cost_total_price
          })
          
          const total_cogm = P2_rm_cost_total_price + P2_maintenance_cost_total_price + P2_energy_cost_total_price + P2_direct_labour_cost_total_price + P2_laterite_cost_total_price

          if(this.sales_all_time_total_process_cost_components[name] === undefined){

            this.sales_all_time_total_process_cost_components[name] = 0

          }

          this.sales_all_time_total_process_cost_components[name] += total_cogm
          
  
          return {
            ...sale_item,
            total_cogm, 
            cogm_component: {
              total_energy_cost: P2_energy_cost_total_price,
              total_laterite_cost: P2_laterite_cost_total_price,
              total_direct_labour_cost: P2_direct_labour_cost_total_price,
              total_maintenance_cost: P2_maintenance_cost_total_price,
              total_rm_procurement_cost: P2_rm_cost_total_price
            },
            P2_rm_cost_total_price,
            P2_maintenance_cost_total_price,
            P2_energy_cost_total_price,
            P2_direct_labour_cost_total_price,
            P2_laterite_cost_total_price,
            current_accumulated_qty,
            processess:in_range
          }   
        }

        if(name === this.pns_product.name){
          all_time_process_list.forEach( (processed_item) => {
            const {total_shell_output_qty} = processed_item
           
            inc += total_shell_output_qty || 0
            
  
            // Set production economic value item proce
            /**
             * Get the items within scope
             * - maybe get their indexes which will be use to remove later
             */
            processed_item = {
              ...processed_item,
              accumulated_qty:inc,
              supplies:undefined,
            }
  
            if(!stop_populating_in_range && remaining_accumulated_qty >= total_shell_output_qty){
              
              in_range.push(processed_item)
              
              remaining_accumulated_qty -= total_shell_output_qty
            }else{
              stop_populating_in_range = true
              above_range.push(processed_item)
            }
  
          })
  
          /**
           * Review to be sure that item in above_range does hold some value expected to be in_range
           */
  
          if(above_range.length > 0){
            
            // get the first item in the above range list
            let first_index_in_above_range = above_range[0]

            let {
              accumulated_qty,
              PNS_rm_cost_total_price,
              PNS_maintenance_cost_total_price,
              PNS_energy_cost_total_price,
              PNS_direct_labour_cost_total_price,
              PNS_laterite_cost_total_price,
              total_shell_output_qty
            } = first_index_in_above_range
  
            const pns_rm_cost_unit_price = PNS_rm_cost_total_price / (total_shell_output_qty || 0)
            const pns_maintenance_cost_unit_price = PNS_maintenance_cost_total_price / (total_shell_output_qty || 0)
            const pns_energy_cost_unit_price = PNS_energy_cost_total_price / (total_shell_output_qty || 0)
            const pns_direct_labour_cost_unit_price = PNS_direct_labour_cost_total_price / (total_shell_output_qty || 0)
            const pns_laterite_cost_unit_price = PNS_laterite_cost_total_price / (total_shell_output_qty || 0)

            // create new object from removing the expected qty of item
            const ob = {
              ...first_index_in_above_range,
              PNS_rm_cost_total_price: pns_rm_cost_unit_price * remaining_accumulated_qty,

              PNS_maintenance_cost_total_price: pns_maintenance_cost_unit_price * remaining_accumulated_qty,
              PNS_energy_cost_total_price: pns_energy_cost_unit_price * remaining_accumulated_qty,
              PNS_direct_labour_cost_total_price: pns_direct_labour_cost_unit_price * remaining_accumulated_qty,
              PNS_laterite_cost_total_price: pns_laterite_cost_unit_price * remaining_accumulated_qty,

              total_shell_output_qty: remaining_accumulated_qty,
              accumulated_qty: remaining_accumulated_qty,
              supplies:undefined,
            }
  
            // update the in_range list with the outbound dataset
            in_range.push(ob)
  
  
            // Get the remaining qty that should go to the next item iteration
            const difference_qty = accumulated_qty - remaining_accumulated_qty
            // create new object after removing the qty for the in_range_qty
  
            above_range[0] = {
              ...first_index_in_above_range,
              PNS_rm_cost_total_price: pns_rm_cost_unit_price* difference_qty,
              PNS_maintenance_cost_total_price: pns_maintenance_cost_unit_price * difference_qty,
              PNS_energy_cost_total_price: pns_energy_cost_unit_price * difference_qty,
              PNS_direct_labour_cost_total_price: pns_direct_labour_cost_unit_price * difference_qty,
              PNS_laterite_cost_total_price: pns_laterite_cost_unit_price * difference_qty,
              total_shell_output_qty: difference_qty,
              supplies:undefined,
            }
  
            all_time_process_list = above_range
          }
  
          /** 
           * Iterate through the in_range to get the following
           * - total_qty
           * - total_price
           */
          
          let PNS_rm_cost_total_price = 0
          let PNS_maintenance_cost_total_price = 0
          let PNS_energy_cost_total_price = 0
          let PNS_direct_labour_cost_total_price = 0
          let PNS_laterite_cost_total_price = 0
          in_range.forEach(processed_item=>{
            PNS_rm_cost_total_price += processed_item.PNS_rm_cost_total_price
            PNS_maintenance_cost_total_price += processed_item.PNS_maintenance_cost_total_price
            PNS_energy_cost_total_price += processed_item.PNS_energy_cost_total_price
            PNS_direct_labour_cost_total_price += processed_item.PNS_direct_labour_cost_total_price
            PNS_laterite_cost_total_price += processed_item.PNS_laterite_cost_total_price
          })
  
          
          const total_cogm = PNS_rm_cost_total_price + PNS_maintenance_cost_total_price + PNS_energy_cost_total_price + PNS_direct_labour_cost_total_price + PNS_laterite_cost_total_price


          if(this.sales_all_time_total_process_cost_components[name] === undefined){
            this.sales_all_time_total_process_cost_components[name] = 0
          }
          this.sales_all_time_total_process_cost_components[name] += total_cogm
          
  
          return {
            ...sale_item,
            total_cogm, 
            cogm_component: {
              total_energy_cost: PNS_energy_cost_total_price,
              total_laterite_cost: PNS_laterite_cost_total_price,
              total_direct_labour_cost: PNS_direct_labour_cost_total_price,
              total_maintenance_cost: PNS_maintenance_cost_total_price,
              total_rm_procurement_cost: PNS_rm_cost_total_price
            },
            PNS_rm_cost_total_price,
            PNS_maintenance_cost_total_price,
            PNS_energy_cost_total_price,
            PNS_direct_labour_cost_total_price,
            PNS_laterite_cost_total_price,
            current_accumulated_qty,
            processess:in_range
          }   
        }

      })

      this.sales_all_time_process_costing_list_components[name] = result
      
    }

    

    async computeSalesListByProduct(){
        let match = {
            factory:this.factory,
            date:{
                $gte:new Date(this.startDate),
                $lte:new Date(this.endDate)
            }
        }

        if(this.product !== "__ALL__"){
            match = {
                ...match,
                product:this.product
            }
        }

        const list = await SaleModel.aggregate([
            {
              $match:match
            },
            {
              $group:{
                _id:{
                    product:"$product"
                },
                total_quantity:{
                  $sum:"$quantity_in_ton"
                },
                price_total:{
                  $sum:"$price_total"
                },
                avg_product_unit_price:{
                  $avg:"$price_per_ton"
                },
              }
            },
            {
              $project:{
                product:"$_id.product",
                total_quantity:1,
                price_total:1,
                avg_product_unit_price:1,
                _id:0
              }
            },
            {
              $sort:{...sort(this.graphView)}
            }
        ])


        this.list = list.map(product_set=>{
          
            let {price_total,total_quantity,avg_product_unit_price} = product_set
            price_total = getAmountAfterConversion(price_total,this.currency)
            avg_product_unit_price = getAmountAfterConversion(avg_product_unit_price,this.currency)
            total_quantity = parseFloat(total_quantity.toFixed(2))
            return {
              ...product_set,
              price_total,
              avg_product_unit_price,
              total_quantity
            }
        })
    }

  async computeSalesListByDateAndProduct(){
    let match = {
        factory:this.factory,
        date:{
            $gte:new Date(this.startDate),
            $lte:new Date(this.endDate)
        }
    }

    if(this.product !== "__ALL__"){
        match = {
            ...match,
            product:this.product
        }
    }

    const list = await SaleModel.aggregate([
        {
          $match:match
        },
        {
          $group:{
            _id:{
                date:"$date",
                product:"$product",
            },
            total_quantity:{
              $sum:"$quantity_in_ton"
            },
            price_total:{
              $sum:"$price_total"
            },
            avg_product_unit_price:{
              $avg:"$price_per_ton"
            },
          }
        },
        {
          $project:{
            date:"$_id.date",
            product:"$_id.product",
            total_quantity:1,
            price_total:1,
            avg_product_unit_price:1,
            _id:0
          }
        },
        {
          $sort:{
            date:1,
            product:1,
          }
        }
    ])

    

    this.list = list.map(product_set=>{
        let {price_total,total_quantity,avg_product_unit_price} = product_set
        price_total = getAmountAfterConversion(price_total,this.currency)
        avg_product_unit_price = getAmountAfterConversion(avg_product_unit_price,this.currency)
        total_quantity = parseFloat(total_quantity.toFixed(2))
        return {
            ...product_set,
            price_total,
            avg_product_unit_price,
            total_quantity
        }
    })
  }

  async genSalesProductTypesList(){
    let match = {
        factory:this.factory,
    }

    if(this.product !== "__ALL__"){
        match = {
            ...match,
            product:this.product
        }
    }

    const list = await SaleModel.aggregate([
        {
          $match:match
        },
        {
          $group:{
            _id:{
                product:"$product",
            }
          }
        },
        {
          $project:{
            product:"$_id.product",
            _id:0
          }
        },
        {
          $sort:{
            product:1
          }
        }
    ])

    this.product_types = list.map(({product}) => product)
  }
}


module.exports = SaleService