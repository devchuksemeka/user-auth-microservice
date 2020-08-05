const UserModel = require("../../models/user")
const RoleModel = require("../../models/Role")
const NotificationModel = require("../../models/Notification")
const NotificationCategory = require("../../models/NotificationCategory")

const { getMarketPriceValueForOptionsFilterWithProduct,CONSTANT } = require('../index')


const EXPELLERS_SLUG = [
    "machine_1",
    "machine_2",
    "machine_3",
    "machine_4",
]


const getSingleEconomicLostValue = (payload) => {
    try{
        let {total_hours,market_price_from_onset,production,factory} = payload
        
        let {pkc_production_rate_per_hour,pko_production_rate_per_hour,p2_production_rate_per_hour} = production

        // console.log({pkc_production_rate_per_hour,pko_production_rate_per_hour,p2_production_rate_per_hour,total_hours,market_price_from_onset,production,factory})

        if(!factory){
            factory = CONSTANT.FACTORIES.F1
        }

        let total_economic_lost_value = 0
       
        if(factory === CONSTANT.FACTORIES.F1){
            let pko_market_price_value = getMarketPriceValueForOptionsFilterWithProduct(market_price_from_onset,"PKO",production,factory);

            let avg_pko_market_price = pko_market_price_value.avg_market_unit_price
      
      
            let pkc_market_price_value = getMarketPriceValueForOptionsFilterWithProduct(market_price_from_onset,"PKC",production,factory);
            let avg_pkc_market_price = pkc_market_price_value.avg_market_unit_price
      
            let pkc_economic_value_per_ton = pkc_production_rate_per_hour * avg_pkc_market_price
            let pko_economic_value_per_ton = pko_production_rate_per_hour * avg_pko_market_price
            
      
            let pko_economic_lost_value = pko_economic_value_per_ton * total_hours
            let pkc_economic_lost_value = pkc_economic_value_per_ton * total_hours
      
            total_economic_lost_value = pko_economic_lost_value + pkc_economic_lost_value
        }
        else if(factory === CONSTANT.FACTORIES.C1){
            let p2_market_price_value = getMarketPriceValueForOptionsFilterWithProduct(market_price_from_onset,"P2",production,factory);

            let avg_p2_market_price = p2_market_price_value.avg_market_unit_price

            let p2_economic_value_per_ton = p2_production_rate_per_hour * avg_p2_market_price
      
            let p2_economic_lost_value = p2_economic_value_per_ton * total_hours
      
            total_economic_lost_value = p2_economic_lost_value
        }
       
        // console.log(`total_economic_lost_value => ${total_economic_lost_value}`)
        return total_economic_lost_value;
    }catch(err){
        console.log("Error thrown At getSingleEconomicLostValue", err)
        return 0;
    }
}

const getComponentLostEconomicValue = (payload) =>{
    try{

        let {component_payload,total_hours,market_price_from_onset,production,factory} = payload
       
        if(!factory){
            factory = CONSTANT.FACTORIES.F1
        }

        // check the componet payload type
        let {name,slug,category} = component_payload
        let total_economic_lost_value = 0
        if(slug === "all_components"){
            // 
            EXPELLERS_SLUG.forEach(expeller=>{
                total_economic_lost_value += getSingleEconomicLostValue({
                    total_hours,
                    market_price_from_onset,
                    production,
                    factory
                })
            })
        }else{
            total_economic_lost_value += getSingleEconomicLostValue({
                total_hours,
                market_price_from_onset,
                production,
                factory
            })
        }
        

        return total_economic_lost_value;

    }catch(err){
        console.log("Error thrown At getLostEconomicValue: => ", err.message)
        return 0
    }
}

const getStopReasonLostEconomicValue = (payload) =>{
    try{
        let {stop_reason_payload,total_hours,market_price_from_onset,production,factory} = payload
        
        if(!factory){
            factory = CONSTANT.FACTORIES.F1
        }
        // check the componet payload type
        let {name,slug,category} = stop_reason_payload
        let total_economic_lost_value = 0

        if(slug === "civil_issues" || slug === "factory_clean-up" || slug  === "lack_of_diesel" || slug  === "cool-off"){
            // 
            EXPELLERS_SLUG.forEach((expeller,index)=>{
                let value = getSingleEconomicLostValue({
                    total_hours,
                    market_price_from_onset,
                    production,
                    factory
                })
                total_economic_lost_value += value
            })
        }else{
            total_economic_lost_value += getSingleEconomicLostValue({
                total_hours,
                market_price_from_onset,
                production,
                factory
            })
        }
        
        return total_economic_lost_value;
    }catch(err){
        console.log("Error thrown At getLostEconomicValue: => ", err.message)
        return 0
    }
    
}


module.exports = {
    getComponentLostEconomicValue,
    getStopReasonLostEconomicValue
}