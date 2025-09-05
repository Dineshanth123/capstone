const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();


app.use(express.json());
app.use(cors());

connectDB();

module.exports = app;
