const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const YAML = require("js-yaml");
const fs = require("fs");
const path = require("path");

const mongoose = require("mongoose");
//mongoose.connect("mongodb+srv://CIS259:tEBOGi5ghLfNDAKN@cluster0.zly6wii.mongodb.net/MiddleEarthMovies").catch(error => console.log(error));

mongoose
  .connect(
    "mongodb://cosmos-wwg-dev-centralus:2IO6XwrVqSxCXl2AFiQzO1CQ7VdbpqrkmE60dS5N609mPvQ5e507GgWNoNnXP1JxwTopBxLtlWfXQcjMSpAdIw==@cosmos-wwg-dev-centralus.mongo.cosmos.azure.com:10255/test?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@cosmos-wwg-dev-centralus@",
  )
  .then(() => console.log("Connected to MongoDB!"))
  .catch((error) => console.log("Detailed Connection Error:", error));

const app = express();
const PORT = process.env.PORT || 3750;

app.use(express.json());

//Routes
const findRoutes = require("./helpers/findRoutes");
const mountRoute = require("./helpers/mountRoute");

const { routes } = YAML.load(fs.readFileSync("./api/routes.yaml"));

routes.forEach((route) => {
  const routeDir = path.join(__dirname, "api", route.path);

  findRoutes(routeDir).forEach((fn) => {
    mountRoute(app, route.prefix, fn);
  });
});

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Hello World!" });
});

app.listen(PORT, () => {
  console.log(`Listening on localhost:${PORT}`);
});
