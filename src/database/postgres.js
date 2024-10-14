"use strict";
require("dotenv").config();
const { Pool } = require("pg");

const dbConfig = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_INT_PORT,
});
const query = (text, params) => dbConfig.query(text, params);

module.exports = {
  query,
};
