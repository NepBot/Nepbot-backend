const {Client, Pool} = require('pg')
const {POSTGRESQL} = require("../../utils/config");

const postgrePool = new Pool(POSTGRESQL);

module.exports = postgrePool;
