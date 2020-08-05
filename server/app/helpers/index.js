const moment = require('moment')



const convertToDecimal = str => isNaN(parseFloat(str)) ? 0 : parseFloat(str);



const differenceOfDateInHours = (date1,date2) => {
  var a = moment(new Date(date1));
  var b = moment(new Date(date2));
  let hours = Math.abs(b.diff(a, 'hours'));
  return hours;
}

const differenceOfDate = (date1,date2,expected_result_type) => {
  var a = moment(new Date(date1));
  var b = moment(new Date(date2));
  let result = Math.abs(b.diff(a, expected_result_type));
  return result;
}

const numberOfWeeks = (date1,date2) => {
  var a = moment(new Date(date1));
  var b = moment(new Date(date2));
  let weeeks = b.diff(a, 'weeks');
  return weeeks;
}

const numberOfMonths = (date1,date2) => {
  var a = moment(new Date(date1));
  var b = moment(new Date(date2));
  let month = b.diff(a, 'month');
  return month;
}

const convertToDate = (value) =>{
  return moment(new Date(value))
}



const getDateInISO = (str) => {
  return convertToDate(str).toISOString()
}

const CONSTANT = {
  PRODUCTION_RATE:{
    C1:{
      rate_unit:'hour', 
      duration:1, 
      p1_cracked:3.75, // (3.5 || 4 ton/hr)
      p2_production_rate_per_hour:0.675, // p1_cracked * 0.2 * 0.9
      // shell_production_rate_per_hour:20
    }
  },
  USER_APPROVAL_STATUS:{
    APPROVED:"APPROVED",
    DISAPPROVED:"DISAPPROVED",
  },
  USER_ROLES:{
    APPROVED:"DEVELOPER",
    SUPER_ADMIN:"SUPER_ADMIN",
    ADMIN:"ADMIN", 
    FACTORY_MANAGER:"FACTORY_MANAGER",
    CITIZEN:"CITIZEN",
    TROOPER:"TROOPER"
  },

  USD_TO_NAIRA_CONV_RATE:362.82,
  DAY:"day",
  WEEK:"week",
  MONTH:"month",
  DAILY_SALES:"dailySales",
  ACCUMULATED_SALES:"accumulated",
  DAILY_PURCHASE_PRODUCTION:"dailyPurchase",
  ACCUMULATED_PURCHASE_PRODUCTION:"accumulated",

  INVENTORY_PURCHASES:"purchases",
  INVENTORY_PRODUCTIONS:"productions",

  PKO:"PKO",
  PKC:"PKC",
  P2:"P2",

  NAIRA_CURRENCY:"naira",
  USD_CURRENCY:"usd",


  // maintenance levels
  MACHINE_LEVEL:"machine_level",
  FACTORY_LEVEL:"factory_level",
  FACTORY_LEVEL_MACHINE:"factory_level_machine",
  MAINTENANCE_ACTION_LEVEL:"maintenance_action_level",

  // procurement cost levels
  P2_SUPPLY_ANALYSIS:"p2_supply_analysis",
  DIESEL_SUPPLY_ANALYSIS:"diesel_supply_analysis",

  // machine data stats levels
  MACHINE_DATA_RM_CRUSHING:"rm_crushing",
  MACHINE_DATA_MAINTENANCE:"maintenance",
  MACHINE_DATA_UPTIME_AND_DOWNTIME:"uptime_and_downtime",
  MACHINE_DATA_CRUSHING_EFFICIENCY:"crushing_efficiency",
  MACHINE_DATA_UTILIZATION:"utilization",

  // energy data stats levels
  ENERGY_DIESEL_LITRE_AND_AMOUNT_USAGE:"diesel_litre_and_amount_usage",
  ENERGY_GENERATOR_MAINTENANCE_ANALYSIS:"generator_maintenance_tracker_analysis",

    // CRUSHING RM
    MACHINE_ALL_RM: "__ALL__",
    MACHINE_P2_RM: "P2",
    MACHINE_PKC1_RM: "PKC1",


  // MACHINE HEALTH STATUS
  // MACHINE_HEALTH_VERY_GOOD:"very_good",
  MACHINE_HEALTH_GOOD:"on_track",
  MACHINE_HEALTH_OK:"due_soon",
  MACHINE_HEALTH_BAD:"behind",

  FACTORIES:{
    F1:"f1",
    C1:"c1",
  }
}

const currentDateTime = () => {
  const date_v = moment().add(1,"h")
  return date_v;
}

const dateAdd = (date,add,type) => {
  const date_v = moment(new Date(date)).add(add,type)
  return date_v;
}

const getWeekInMonth = (date) => {
  const date_v = moment(new Date(date))
  let week = Math.ceil(date_v.date()/7);

  return `${date_v.format("MMM")} wk${week}`
}

const toTitleCase = (str) => str.split(" ").map(item=>item.substring(0,1).toUpperCase()+item.substring(1)).join(" ")

const getDateWithTimeFormatted = (datetime)=> {
  const date = moment(new Date(datetime)).format("ddd, Do MMM YYYY H:mm A")
  return date;
}

const getDateFormatted = (datetime)=> {
  if(!datetime){datetime = Date.now()}
  const date = moment(new Date(datetime)).format("dddd, Do MMM YYYY")
  return date;
}

const getWeek = (datetime)=> {
  const date = moment(new Date(datetime)).format("YYYY MM ww")
  return date;
}

const getMonth = (datetime)=> {
  const date = moment(new Date(datetime)).format("MMM YYYY")
  return date;
}

const getDate = (datetime)=> {
  const date = moment(new Date(datetime)).format("Do MMM")
  return date;
}

const dateAddDays = (date,add) => {
  const date_v = moment(new Date(date)).add(add,"d")
  return date_v;
}


const startOfDay = (date) => {
  const date_v = moment(new Date(date)).startOf("day")
  return date_v;
}

const dateSubtractDays = (date,number_of_days) => {
  const date_v = moment(new Date(date)).subtract(number_of_days,"d")
  return date_v;
}

const dateAddWeeks = (date,add) => {
  const date_v = moment(new Date(date)).add(add,"w")
  return date_v;
}

const dateSubtractWeeks = (date,number_of_weeks) => {
  const date_v = moment(new Date(date)).subtract(number_of_weeks,"w")
  return date_v;
}

const dateAddMonths = (date,add) => {
  const date_v = moment(new Date(date)).add(add,"M")
  return date_v;
}

const dateSubtractMonths = (date,number_of_months) => {
  const date_v = moment(new Date(date)).subtract(number_of_months,"M")
  return date_v;
}

const formatDateDay = (day) => {
  return day < 10 ? `0${day}` : day
}

const formatDateMonth = (month) => {
  return month < 10 ?  `0${month}` : month
}

const getDayOfYear = (date) =>{
  return moment(date).dayOfYear()
}

const getWeekOfYear = (date) =>{
  return moment(date).week()
}

const getMonthOfYear= (date) =>{
  return moment(date).month() + 1
}

const getWeekStartAndEndDate = () => {
  let start_date = moment().startOf("isoWeek").toDate();
  let end_date = moment().endOf("isoWeek").toDate();

  return {start_date,end_date}
}

const start_of_today = moment().startOf("day").toDate()
const end_of_today = moment().endOf("day").toDate()



module.exports= {
  getWeekStartAndEndDate,
  CONSTANT,
  differenceOfDateInHours,
  dateAddDays,
  getDate,
  convertToDecimal,
  numberOfWeeks,
  numberOfMonths,
  convertToDate,
  getDateInISO,
  dateAdd,
  getWeekInMonth,
  toTitleCase,
  getWeek,
  getMonth,
  dateAddWeeks,
  dateAddMonths,
  getWeekOfYear,
  getMonthOfYear,
  getDayOfYear,
  differenceOfDate,
  getDateWithTimeFormatted,
  getDateFormatted,
  startOfDay,
  currentDateTime,
}
