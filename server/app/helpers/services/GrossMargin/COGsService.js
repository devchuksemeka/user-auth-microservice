// const Maintenance

const MaintenanceCostService = require("../Maintenance/MaintenanceCostService")
const DirectLabourCostService = require("../DirectLabour/DirectLabourCostService")
const EnergyCostService = require("../Energy/EnergyCostService")
const SupplyCostService = require("../Supply/SupplyCostService")
const LateriteCostService = require("../Laterite/LateriteCostService")
const { CONSTANT } = require("../..")
const BaseService = require("../BaseService")
const ProcessService = require("../Process/ProcessService")
const SaleService = require("../Sale/SaleService")
const CashFlowService = require("../Cashflow/CashFlowService")

class COGsService extends BaseService{

    constructor(payload){
        super(payload)

        this.total_cogs = 0
        this.drivers = {}
        this.datasets = {}
        this.labels = []

        /**
         * COST DRIVERS
        **/ 

        // maintenance cost attributes 
        this.total_maintenance_cost = 0
        this.maintenance_datasets = {}

        // direct labout cost attributes 
        this.total_direct_labour_cost = 0
        this.direct_labour_datasets = {}

        // laterite cost attributes 
        this.total_laterite_cost = 0
        this.laterite_datasets = {}

        // energy cost attributes 
        this.total_energy_cost = 0
        this.energy_datasets = {}

        // supply cost attributes 
        this.total_purchase_cost = 0
        this.purchase_datasets = {}

        // reconciliation list
        this.reconciliation_list = []

    }


    async computeCOGs(){

        /**
         * Compute COGM for production
         */
        if(this.revenue_category === this.revenue_category_types.production){
            const processService = new ProcessService(this.payload)
            await processService.generateListWithinDate()

            /**
             * Get Maintenance Cost
            */
            this.total_maintenance_cost = processService.processed_total_cost_of_good_manufactured_within_range_component.total_maintenance_cost
            // this.maintenance_datasets = maintenanceCostService.datasets

            // /**
            //  * Get Direct Labour Cost
            // */
            this.total_direct_labour_cost = processService.processed_total_cost_of_good_manufactured_within_range_component.total_direct_labour_cost
            // this.direct_labour_datasets = directLabourCostService.datasets

            /**
             * Get Laterite Cost
            */
            this.total_laterite_cost =  processService.processed_total_cost_of_good_manufactured_within_range_component.total_laterite_cost
            // this.laterite_datasets = lateriteCostService.datasets
            /**
             * Get Energy Cost
            */
            this.total_energy_cost =  processService.processed_total_cost_of_good_manufactured_within_range_component.total_energy_cost
            // this.energy_datasets = energyCostService.datasets

            /**
             * Get Purchase Cost
            */
            const supplyCostService = new SupplyCostService(this.payload)
            await supplyCostService.generateAllEntities()
            this.total_purchase_cost = supplyCostService.total_amount
            this.purchase_datasets = supplyCostService.datasets
        }


         /**
         *      Compute COGM for actual sales
         */
        else if(this.revenue_category === this.revenue_category_types.sale){
            const saleService = new SaleService(this.payload)
            await saleService.computeListWithinRange()

            /**
             * Get Maintenance Cost
            */
            this.total_maintenance_cost = saleService.sales_total_cogm_component_within_range.total_maintenance_cost
            // this.maintenance_datasets = maintenanceCostService.datasets

            // /**
            //  * Get Direct Labour Cost
            // */
            this.total_direct_labour_cost = saleService.sales_total_cogm_component_within_range.total_direct_labour_cost
            // this.direct_labour_datasets = directLabourCostService.datasets

            /**
             * Get Laterite Cost
            */
            this.total_laterite_cost =  saleService.sales_total_cogm_component_within_range.total_laterite_cost
            // this.laterite_datasets = lateriteCostService.datasets
            /**
             * Get Energy Cost
            */
            this.total_energy_cost =  saleService.sales_total_cogm_component_within_range.total_energy_cost
            // this.energy_datasets = energyCostService.datasets

            /**
             * Get Purchase Cost
            */
            this.total_purchase_cost =  saleService.sales_total_cogm_component_within_range.total_rm_procurement_cost
            // this.purchase_datasets = supplyCostService.datasets
        }

         /**
         *      Compute COGM for cash-flow
         */
        else if (this.revenue_category === this.revenue_category_types.cashflow){

            const cashflowService = new CashFlowService(this.payload)
            await cashflowService.computeProcessListWithinRange()

            const {processService} = cashflowService
            
            /**
             * Get Maintenance Cost
            */
           this.total_maintenance_cost = processService.processed_total_cost_of_good_manufactured_within_range_component.total_maintenance_cost
           // this.maintenance_datasets = maintenanceCostService.datasets

           // /**
           //  * Get Direct Labour Cost
           // */
           this.total_direct_labour_cost = processService.processed_total_cost_of_good_manufactured_within_range_component.total_direct_labour_cost
           // this.direct_labour_datasets = directLabourCostService.datasets

           /**
            * Get Laterite Cost
           */
           this.total_laterite_cost =  processService.processed_total_cost_of_good_manufactured_within_range_component.total_laterite_cost
           // this.laterite_datasets = lateriteCostService.datasets
           /**
            * Get Energy Cost
           */
           this.total_energy_cost =  processService.processed_total_cost_of_good_manufactured_within_range_component.total_energy_cost
           // this.energy_datasets = energyCostService.datasets

           /**
            * Get Purchase Cost
           */
           this.total_purchase_cost =  processService.processed_total_cost_of_good_manufactured_within_range_component.total_rm_procurement_cost
           // this.purchase_datasets = supplyCostService.datasets

           this.reconciliation_list = processService.processed_list_within_range
        }
        

       this.computeTotalCogs()

        // this.labels = processed_list_within_date

        /**
         * Put all dataset keys in a single array
        */
        this.labels = [
            ...Object.keys(this.purchase_datasets),
            ...Object.keys(this.laterite_datasets),
            ...Object.keys(this.maintenance_datasets),
            ...Object.keys(this.energy_datasets),
            ...Object.keys(this.direct_labour_datasets),
        ]

        this.labels  = Array.from(new Set(this.labels))
        
        this.labels.forEach((label)=>{

            if(this.datasets[label] === undefined){
                this.datasets[label] = 0
            }

            /**
            * Add up all cost parameter together
            */
           let maintenance_cost = this.maintenance_datasets[label] || 0
           let energy_cost = this.energy_datasets[label] || 0
           let direct_labour_cost = this.direct_labour_datasets[label] || 0
           let purchase_cost = this.purchase_datasets[label] || 0
           let laterite = this.laterite_datasets[label] || 0
           let amount = maintenance_cost + direct_labour_cost + purchase_cost + energy_cost

           if(this.factory === CONSTANT.FACTORIES.C1){
                amount += laterite
            }

            this.datasets[label] = amount
        })

        this.drivers = {
            laterite:this.total_laterite_cost,
            maintenance:this.total_maintenance_cost,
            purchase:this.total_purchase_cost,
            energy:this.total_energy_cost,
            direct_labour:this.total_direct_labour_cost,
        }
    }

    computeTotalCogs(){
        let total_amount = this.total_maintenance_cost + this.total_purchase_cost + this.total_energy_cost + this.total_direct_labour_cost
        if(this.factory === CONSTANT.FACTORIES.C1){
            total_amount += this.total_laterite_cost
        }
        this.setTotalCogs(total_amount)
    }

    setTotalCogs(amount){
        this.total_cogs = amount
    }
}

module.exports = COGsService