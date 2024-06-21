require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");

const app = express();
const server = http.createServer(app);

// Use CORS
app.use(cors());

// Routes setup
let routes = require("./routes/index");

// Parse JSON bodies


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true }));

app.use("/", routes);


app.set("port", process.env.PORT || 8080);

server.listen(app.get("port"), function() {
  console.log("Server started on port " + app.get("port"));
});
