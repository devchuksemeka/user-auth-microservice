const moment = require('moment')
const MarketPriceModel = require('../../../models/MarketPrice')
const BaseService = require('../BaseService')
const { getAmountAfterConversion } = require('../..')
// const {CONSTANT} = require("../../helpers")

class MarketPriceService extends BaseService{

  constructor(payload){
    super(payload)

      // const {factory,startDate,endDate} = payload
      console.log("-- Market Price Service Constructor")

      this.list_up_till_end_date = []
      this.market_price_all_time_list = []
  }

  async generateListUpTillEndDate() {
      this.list_up_till_end_date = await MarketPriceModel.aggregate([
          {
            $match:{
              factory:this.factory,
              date:{
                $lte:new Date(this.endDate)
              },
              commodity:{$in:["PKO","PKC","P2","SHELL"]}
            }
          },
          {
            $group:{
              _id:{
                date:"$date",
                factory:"$factory",
                commodity:"$commodity"
              },
              total_price:{
                $sum:"$price_per_ton"
              },
              avg_market_unit_price:{
                $avg:"$price_per_ton"
              }
            }
          },
          {
            $project:{
              date:"$_id.date",
              product:"$_id.commodity",
              factory:"$_id.factory",
              total_price:1,
              avg_market_unit_price:1,
              _id:0
            }
          },
          {
            $sort:{
              date:1
            }
          },
      ]);
  }

  async computeAllTimeList() {
    const list = await MarketPriceModel.aggregate([
      {
        $match:{
          factory:this.factory
        }
      },
      {
        $group:{
          _id:{
            date:"$date",
            factory:"$factory",
            commodity:"$commodity"
          },
          total_price:{
            $sum:"$price_per_ton"
          },
          avg_market_unit_price:{
            $avg:"$price_per_ton"
          },
          avg_logistic_cost_price:{
            $avg:"$logistic_cost_per_ton"
          }
        }
      },
      {
        $project:{
          date:"$_id.date",
          product:"$_id.commodity",
          factory:"$_id.factory",
          total_price:1,
          avg_market_unit_price:1,
          logistic_cost_per_ton:'$avg_logistic_cost_price',
          _id:0
        }
      },
      {
        $sort:{
          date:1
        }
      }
    ]);
    this.market_price_all_time_list = list.map(market_price=>{
      let {total_price,avg_market_unit_price,logistic_cost_per_ton} = market_price
      logistic_cost_per_ton = getAmountAfterConversion(logistic_cost_per_ton,this.currency)
      total_price = getAmountAfterConversion(total_price,this.currency)
      avg_market_unit_price = getAmountAfterConversion(avg_market_unit_price,this.currency)
      return {
        ...market_price,
        total_price,
        avg_market_unit_price,
        logistic_cost_per_ton
      }
    })
  }

}

module.exports = MarketPriceService