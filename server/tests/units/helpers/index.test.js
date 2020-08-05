const helper_index = require('../../../app/helpers/index');

 const date_label_attributes = {
    month_of_year:11,
    day_of_year:201,
    year:2019,
    week_of_year:44,
    day_of_month:5
 }
describe("Testing (generateToDateLabelFormat) function",()=>{
  test('Works for Daily View: ', () => {
    const new_date = helper_index.convertToDate(`${date_label_attributes.year}/${date_label_attributes.month_of_year}/${date_label_attributes.day_of_month}`);
    expect(helper_index.generateToDateLabelFormat(date_label_attributes,helper_index.CONSTANT.DAY))
      .toBe(helper_index.getDate(new_date));
  });

  test('Works for Weekly View: ', () => {
      // const new_date = helper_index.convertToDate(`${date_label_attributes.year}/${date_label_attributes.month_of_year}/${date_label_attributes.day_of_month}`);
    expect(helper_index.generateToDateLabelFormat(date_label_attributes,helper_index.CONSTANT.WEEK))
      .toBe(`Week ${date_label_attributes.week_of_year} ${date_label_attributes.year}`)
  });

  test('Works for Monthly View: ', () => {
      const new_date = helper_index.convertToDate(`${date_label_attributes.year}/${date_label_attributes.month_of_year}/01`);
    expect(helper_index.generateToDateLabelFormat(date_label_attributes,helper_index.CONSTANT.MONTH))
      .toBe(helper_index.getMonth(new_date));
  });
})
