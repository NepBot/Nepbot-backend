const { Pool } = require('pg');
const parse = require('pg-connection-string').parse;
const config = require('../../utils/config');

const connnectStr = parse(config.near_indexer);
const nearIndexerPool = new Pool(connnectStr);
module.exports = nearIndexerPool;