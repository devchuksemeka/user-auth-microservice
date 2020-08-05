const moment = require("moment")
class BaseService{
    constructor(payload){
        
        const {factory,startDate,endDate,graphView,currency,revenue_category,is_revenue_with_logistics} = payload
        console.log("-- BaseService Constructor")

        this.payload = payload
        this.factory = factory
        this.graphView = graphView
        this.currency = currency
        this.revenue_category = revenue_category || "production"
        this.startDate = moment(startDate).toDate()
        this.endDate = moment(endDate).toDate()

        this.is_revenue_with_logistics = true
        // is_revenue_with_logistics
        if(is_revenue_with_logistics === "true" || is_revenue_with_logistics === "1" || is_revenue_with_logistics === 1 || is_revenue_with_logistics === true){
            this.is_revenue_with_logistics = true
        }
        if(is_revenue_with_logistics === "false" || is_revenue_with_logistics === "0" || is_revenue_with_logistics === 0 || is_revenue_with_logistics === false){
            this.is_revenue_with_logistics = false
        }
       

        // revenue_categories
        this.revenue_category_types = {
            production:"production",
            sale:"sale",
            cashflow:"cashflow",
        }
        /**
         * C1 product types 
         */
        this.p2_product = {
            name:"P2",
            types: ["P2A","P2B"]
        }

        this.pns_product = {
            name:"PNS",
            types: ["PNS"]
        }

        /**
         * F1 product types 
         */
        this.pko_product = {
            name:"PKO",
            types: ["PKO"]
        }
        this.pkc_product = {
            name:"PKC",
            types: ["PKC"]
        }
    }
}


module.exports = BaseService