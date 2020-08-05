// const Maintenance

const MaintenanceCostService = require("../Maintenance/MaintenanceCostService")
const DirectLabourCostService = require("../DirectLabour/DirectLabourCostService")
const EnergyCostService = require("../Energy/EnergyCostService")
const SupplyCostService = require("../Supply/SupplyCostService")
const ProductionRevenueService = require("./RevenueServices/ProductionRevenueService")
const GrossMarginChartService = require("./Chart/GrossMarginChartService")
const SaleService = require("../Sale/SaleService")
const ProcessService = require("../Process/ProcessService")
const BaseService = require("../BaseService")
const CashFlowService = require("../Cashflow/CashFlowService")

class RevenueService extends BaseService{

    constructor(payload){
        super(payload)
        const{revenue_category} = payload
        this.revenue_category = revenue_category
        this.payload = payload
        this.total_revenue = 0
        this.total_sales_logistics = 0
        this.total_actual_sales_revenue = 0
        this.reconciliation_list = []
        this.drivers = {}
        this.datasets = {}
    }

    async computeRevenue(){
        // check the revenue_category
        if(this.revenue_category === this.revenue_category_types.production) await this.computeProductionRevenue()
        if(this.revenue_category === this.revenue_category_types.sale) await this.computeSaleRevenue()
        if(this.revenue_category === this.revenue_category_types.cashflow) await this.computeSaleRevenue()

    }
   

    async computeProductionRevenue(){
        const processService = new ProcessService(this.payload)
        await processService.generateListWithinDate()

        this.reconciliation_list = processService.processed_list_within_range
        this.total_revenue = processService.processed_total_price_within_range
        // this.drivers= revenueService.drivers
        this.datasets = processService.processed_total_price_within_range_dataset
        this.setTotalActualSalesRevenue()
       
    }

    async computeSaleRevenue(){

        /**
         * Use to compute sales revenue
        */
        const salesService = new SaleService(this.payload)
        await salesService.computeListWithinRange()
        
        this.reconciliation_list = salesService.sales_list_within_range
        this.total_revenue = salesService.sales_total_price_within_range
        this.total_sales_logistics = salesService.sales_total_logistics_within_range
        this.datasets = salesService.sales_total_price_within_range_dataset
        this.setTotalActualSalesRevenue()
    }

    async computeCashFlowRevenue(){

        /**
         * Use to compute cashflow revenue
        */
        const cashService = new CashFlowService(this.payload)
        await cashService.computeSaleListWithinRange()

        const {salesService} = cashflowService
        
        this.reconciliation_list = salesService.sales_list_within_range
        this.total_revenue = salesService.sales_total_price_within_range
        this.datasets = salesService.sales_total_price_within_range_dataset
        this.total_sales_logistics = salesService.sales_total_logistics_within_range
        this.setTotalActualSalesRevenue()
        
    }

    setTotalActualSalesRevenue(){
        this.total_actual_sales_revenue = this.total_revenue - this.total_sales_logistics
    }
    

}

module.exports = RevenueService