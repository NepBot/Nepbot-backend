const nearIndexerPool = require('../models/db_driver/postgre_driver');
const logger = require('./logger');
const config = require('./config');

const getTxn = async (guildId) => {
	const client = await nearIndexerPool.connect();
	const sqlStr = `
  SELECT
  	DISTINCT args -> 'args_json' -> 'roles' AS roles, args -> 'args_json' -> 'timestamp' AS timestamp , originated_from_transaction_hash AS transaction_hash
  FROM
	action_receipt_actions
  RIGHT JOIN receipts ON receipts.receipt_id = action_receipt_actions.receipt_id 
  WHERE
	receipt_receiver_account_id = '${config.rule_contract}' and
	args ->> 'method_name' = 'set_roles' and
	args -> 'args_json' -> 'roles' -> 0 ->> 'guild_id' = '${guildId}'
  ORDER BY args -> 'args_json' -> 'timestamp' desc`;
	const res = await client.query(sqlStr);
	await client.release();
	return res.rows
};
module.exports = {
	getTxn,
};

