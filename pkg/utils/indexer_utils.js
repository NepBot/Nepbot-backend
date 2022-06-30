const nearIndexerPool = require('../models/db_driver/postgre_driver');
const logger = require('./logger');
const config = require('./config');

const getTxn = async (guildId) => {
	const client = await nearIndexerPool.connect();
	const sqlStr = `SELECT b.transaction_hash, b.args -> 'args_json' -> 'roles' AS roles FROM
  (SELECT transaction_hash FROM transactions WHERE receiver_account_id = '${ config.rule_contract }') AS a 
  LEFT JOIN transaction_actions AS b ON a.transaction_hash = b.transaction_hash 
  WHERE 
  	position(b.args -> 'args_json' in ${guildId}) > -1
  ORDER BY b.args -> 'args_json' -> 'timestamp' desc`;
	const res = await client.query(sqlStr);
	await client.release();
	return res.rows
};
module.exports = {
	getTxn,
};

