const Joi = require("@hapi/joi");
const {CONSTANT} = require("../helpers");

const factories = ["f1","c1"]
const products = ["__all__","pko","pkc","pksl","p2","p2b","p2a","pns"]
const shifts = [1,2,12]

module.exports = {
  userSignupSchema: Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["ng"] } })
      .pattern(/@releaf\.ng$/, {
        name: "releaf domain"
      })
      .rule({ message: "email must be a valid releaf domain" })
      .required(),
    password: Joi.string()
      .pattern(/\S{6,30}$/)
      .rule({ message: "password must be at least 6 characters" })
      .required(),
    repeat_password: Joi.ref("password"),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
  }).with("password", "repeat_password"),

  userLoginSchema: Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["ng"] } })
      .pattern(/@releaf\.ng$/, {
        name: "releaf domain"
      })
      .rule({ message: "email should be a valid releaf domain" })
      .required(),
    password: Joi.string().required()
  }),

  setRoleSchema: Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ["ng"] } })
      .pattern(/@releaf\.ng$/, {
        name: "releaf domain"
      })
      .rule({ message: "email should be a valid releaf domain" })
      .required(),
    role: Joi.number()
      .valid(1, 2)
      .required()
  }),
  changePassword:Joi.object({
    old_password:Joi.string().required(),
    new_password:Joi.string().required(),
    new_password_again:Joi.string().required(),
  }),
  createSetting:Joi.object({
    type:Joi.string().required(),
    name:Joi.string().required(),
    value:Joi.number().required(),
  }),
  updateSetting:Joi.object({
    type:Joi.string().required(),
    name:Joi.string().required(),
    value:Joi.number().required(),
  }),
  createRole:Joi.object({
    name:Joi.string().required(),
  }),
  createPermission:Joi.object({
    name:Joi.string().required(),
  }),
  createNotificationCategory:Joi.object({
    name:Joi.string().required(),
  }),
  addPermissionToRole:Joi.object({
    role_id:Joi.string().required(),
    category_id:Joi.string().required(),
  }),
  addNotificationSettingToUser:Joi.object({
    user_id:Joi.string().required()
  }),
  updateUserRole:Joi.object({
    user_id:Joi.string().required(),
    role_id:Joi.string().required(),
  }),

  updateUserAccountApprovalStatus:Joi.object({
    status:Joi.string().valid(CONSTANT.USER_APPROVAL_STATUS.APPROVED,CONSTANT.USER_APPROVAL_STATUS.DISAPPROVED).required(),
  }),

  /**
   * Request Query validator
   */
  supplyDailyPurchaseFilterSchema:Joi.object({
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    currency:Joi.string().valid("naira","usd").required(),
    product:Joi.string().valid("p2").required(),
    currentView:Joi.string().valid("dailyPurchase").required()
  }),
  /**
   * production widgets validation schema
   */
  inventoryWidgetProductionFilterSchema:Joi.object({
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    currency:Joi.string().valid("naira","usd").required(),
    product:Joi.string().valid("pko","pkc").required(),
    currentView:Joi.string().valid("dailyPurchase","accumulated").required()
  }),

  supplyDailyProductionFilterSchema:Joi.object({
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    currency:Joi.string().valid("naira","usd").required(),
    product:Joi.string().valid("pko","pkc").required(),
    currentView:Joi.string().valid("dailyPurchase").required()
  }),

  dailyProductionSalesSchema:Joi.object({
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    currency:Joi.string().valid("naira","usd").required(),
    product:Joi.string().valid("pko","pkc","pksl").required()
  }),

  productionSalesValidator:Joi.object({
    factory:Joi.string().valid(...factories).required(),
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    currency:Joi.string().valid("naira","usd").required(),
    product:Joi.string().valid(...products).required()
  }),

  attributesParameters:Joi.object({
    factory:Joi.string().valid("f1","c1").required(),
  }),

  defaultOverviewScheman:Joi.object({
    factory:Joi.string().valid("f1","c1").required(),
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    currency:Joi.string().valid("naira","usd").required(),
  }),
  defaultOverviewProductSchema:Joi.object({
    factory:Joi.string().valid("f1","c1").required(),
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    product:Joi.string().valid("PKO","PKC","PKSL").required()
  }),

  aggregatedDowntimeModelGraphView:Joi.object({
    factory:Joi.string().valid("f1","c1").required(),
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month","combine").required(),
    // currency:Joi.string().valid("naira","usd").required(),
    // product:Joi.string().valid("pko","pkc","pksl").required()
  }),
  
  aggregatedMachineDowntimeAnalysisReport:Joi.object({
    factory:Joi.string().valid("f1","c1").required(),
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month","combine").required(),
    stop_reason:Joi.string().required(),
    stop_reference:Joi.string().required(),
    machine:Joi.string().required(),
    machine_slug:Joi.string(),
    maintenance_action:Joi.string().optional(),
    repair_rp:Joi.string().optional(),
    component_view:Joi.string().when('factory', { 
      is: "f1", then: Joi.optional(), 
      otherwise: Joi.valid("component","sub_component").required() 
    }),
    sub_component:Joi.string().when('factory', { 
      is: "f1", 
      then: Joi.optional(), 
      otherwise: Joi.when('component_view', { 
        is: "component", 
        then: Joi.optional(), 
        otherwise: Joi.required() 
      }), 
    }),
  }),
  

  repairRpsDowntimeSchema:Joi.object({
    factory:Joi.string().valid("f1","c1").required(),
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    stop_reason:Joi.string().required(),
    stop_reference:Joi.string().required(),
    machine:Joi.string().required(),
    repair_rp:Joi.string().required(),
    sub_component:Joi.string().when('machine', { is: "all_machines", then: Joi.optional(), otherwise: Joi.required() }),
  }),

  productionRevenueScheman:Joi.object({
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    factory:Joi.string().valid("f1","c1").required(),
  }),

  gmatRevenueSchema:Joi.object({
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    graphView:Joi.string().valid("day","week","month").required(),
    factory:Joi.string().valid("f1","c1").required(),
    revenue_category:Joi.string().valid("production","sale","cashflow").required(),
    is_revenue_with_logistics:Joi.boolean().required()
  }),


  reasonForDowntimeAggregatedGraphView:Joi.object({
    startDate:Joi.string().isoDate().required(),
    endDate:Joi.string().isoDate().required(),
    // currency:Joi.string().valid("naira","usd").required(),
    // product:Joi.string().valid("pko","pkc","pksl").required()
  }),

  createStopReasonTypes:Joi.object({
    factory:Joi.string().valid(...factories).required(),
    name:Joi.string().required(),
    color_code:Joi.string().required(),
  }),

  factoryMustValidator:Joi.object({
    factory:Joi.string().valid(...factories).required()
  }),

  stopProductionValidator:Joi.object({
    factory:Joi.string().valid(...factories).required(),
    stop_id:Joi.string().required(),
    request_time:Joi.date().required(),
    uuid:Joi.any().optional(),
    production_state:Joi.string().optional(),
    category:Joi.string().optional(),
  }),

  pauseProductionValidator:Joi.object({
    factory:Joi.string().valid(...factories).required(),
    component:Joi.string().required(),
    stop_id:Joi.string().required(),
    request_time:Joi.date().required(),
    uuid:Joi.any().optional(),
    production_state:Joi.string().optional(),
    category:Joi.string().optional(),
  }),

  issueTrackerValidator:Joi.object({
    factory:Joi.string().valid(...factories).required(),
    stop_id:Joi.string().required(),
    stop_type:Joi.string().required(),
    stop_description:Joi.string().required(),
    component:Joi.string().required(),
    sub_component:Joi.string().optional(),
    root_cause:Joi.string().required(),
    diagnosis_details:Joi.string().required(),
    prev_id:Joi.string().optional(),
  }),

  startProductionValidator:Joi.object({
    factory:Joi.string().valid(...factories).required(),
    shift:Joi.string().valid(...shifts).required(),
    request_time:Joi.date().required(),
    uuid:Joi.any().optional(),
    production_state:Joi.string().optional(),
    category:Joi.string().optional(),
  }),
  resumeProductionValidator:Joi.object({
    factory:Joi.string().valid(...factories).required(),
    request_time:Joi.date().required(),
    uuid:Joi.any().optional(),
    production_state:Joi.string().optional(),
    category:Joi.string().optional(),
  }),

  productionDetailValidator:Joi.object({
    factory:Joi.string().valid(...factories).required(),
    production_id:Joi.any().required(),
  }),
};
