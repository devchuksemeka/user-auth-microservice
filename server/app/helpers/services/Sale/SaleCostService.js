const moment = require('moment')
const ProcessService = require('../Process/ProcessService')
const SaleModel = require('../../../models/Sale')
// const {CONSTANT} = require("../../helpers")



class SaleCostService{
    constructor(payload){

        const {factory,startDate,endDate} = payload
        console.log("-- Sale Cost Service Constructor")

        this.payload = payload
        this.factory = factory
        this.startDate = moment(startDate).toDate()
        this.endDate = moment(endDate).toDate()
        this.list = []
        this.total_amount = 0
        this.drivers = {}
      
    }

    async generateListGroupedByProduct(){
      const list = await SaleModel.aggregate([
        {
          $match:{
            factory:this.factory,
            date:{
              $gte:new Date(this.startDate),
              $lte:new Date(this.endDate),
          },
          }
        },
        {
          $group:{
            _id:{
              product:"$product"
            },
            price_total:{
              $sum:"$price_total"
            }
          }
        },
        {
          $project:{
            product:"$_id.product",
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

      this.list = list
    }




    async computeTotalAmount(){
      await this.generateListGroupedByProduct()
      // console.log("the list", this.list)

      let total_amount = 0
      this.list.forEach((sale)=>{
        const amount = sale.price_total
        total_amount += amount
        this.drivers[sale.product] = amount
      })

      this.setTotalAmount(total_amount)
    }

    setTotalAmount(amount){
      this.total_amount = amount || 0
    }
}

module.exports = SaleCostService