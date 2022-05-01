const { Pool } = require('pg');
const config = require('../../utils/config');

const postgrePool = new Pool(config.near_indexer);

module.exports = postgrePool;