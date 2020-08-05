const DailyMetricModel = require('../../../models/DailyMetric')
const SaleModel = require('../../../models/Sale')
const {CONSTANT, getAmountAfterConversion, getDateLableUsingViewFormat} = require("../../index")
const moment = require('moment')
const SaleService = require('./SaleService');

class SaleChartService{

    constructor(payload){
        const {factory,startDate,endDate,currency,product,graphView} = payload

        this.payload = payload
        this.factory = factory
        this.startDate = moment(startDate).toDate()
        this.endDate = moment(endDate).toDate()
        this.currency = currency
        this.graphView = graphView
        this.product = product ? product.toUpperCase() : ""
        this.list = []
        this.datasets = {}

    }

    async computeSalesDataset(){
      const saleService = new SaleService(this.payload)
      await saleService.computeSalesListByDateAndProduct()

      const list = saleService.list
      

      /**
      * Iterate the list and manipulate the chart dataset
      */
     this.datasets = this.genDatasetFromDateAndProductList(list) 
    }

    genDatasetFromDateAndProductList(list){
      const datasets = {}
      
      if(list && list.length > 0){
        list.forEach(sale=>{
          
          const {date,product,price_total,total_quantity} = sale
          let formatted_date = getDateLableUsingViewFormat(date,this.graphView)
         
          if(datasets[formatted_date] === undefined) {
            datasets[formatted_date] = {}
          }

          if(datasets[formatted_date][product] === undefined){
            datasets[formatted_date][product] = {
              price_total:0,
              total_quantity:0,
            }
          }

          datasets[formatted_date][product].price_total += price_total
          datasets[formatted_date][product].total_quantity += total_quantity
        });
      }

      return datasets
    }
}


module.exports = SaleChartService