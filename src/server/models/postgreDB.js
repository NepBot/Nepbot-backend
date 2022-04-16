const {Client, Pool} = require('pg')
const {POSTGRESQL} = require("../../config");

const postgrePool = new Pool(POSTGRESQL);

module.exports = postgrePool;
