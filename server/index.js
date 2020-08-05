require('dotenv').config();
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const routes = require("./app/routes");
// require("./app/console/index")


const app = express();
app.use(cors());

// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));

// const dbURL = process.env.NODE_ENV === "test" ? process.env.MONGOHQ_TEST_URL : process.env.MONGOHQ_URL;
const dbURL = process.env.MONGODB_URL;

mongoose.connect(dbURL,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  }
).then(()=>{

  routes(app);
  app.all("*", (req, res) => {
    res.status(404).send({ message: "route not found" });
  });
  
})
.catch(err => {
  console.log(err)
  throw err;
});

const port = process.env.PORT;


app.listen(port, () => {
  console.log(`app is listening on port ${port}!`);
});
