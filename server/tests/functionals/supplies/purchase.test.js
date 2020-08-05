const app = require('../../../index') // Link to your server file
const supertest = require('supertest')
const request = supertest(app)

/**
 * Setting up a test database
 */
// const databaseName = 'test'
// const mongoose = require('mongoose')
// beforeAll(async () => {
//   const url = `mongodb://127.0.0.1/${databaseName}`
//   await mongoose.connect(url, { useNewUrlParser: true })
// })

// Cleans up database between each test
// afterEach(async () => {
//     await User.deleteMany()
//   })

/**
 * Removing all test collection
 * 
 */
// async function removeAllCollections () {
//     const collections = Object.keys(mongoose.connection.collections)
//     for (const collectionName of collections) {
//       const collection = mongoose.connection.collections[collectionName]
//       await collection.deleteMany()
//     }
//   }
  
//   afterEach(async () => {
//     await removeAllCollections()
//   })

const getRequestParams = () =>{
    return "graphView=day&startDate=2019-09-31T23:00:00&endDate=2019-12-31T22:59:59&currency=naira&product=p2&currentView=dailyPurchase";
}
describe("Test Supply Product Purchase API Endpoints",()=>{
    test('Daily Product Purchase', async done => {
        const response = await request.get(`/api/v1/supplies/purchases?${getRequestParams()}`)
        expect(response.status).toBe(200)
        expect(response.body.datasets).toBeTruthy()
        expect(response.body.labels).toBeTruthy()
        expect(response.body.extras).toBeTruthy()
        // expect(response.body.extras.avg_production_rate_per_hour).toBeTruthy()
        done()
    });
})