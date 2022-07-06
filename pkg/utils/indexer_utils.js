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
	client.release();
	return res.rows
};

const getParasTokenPerOwnerCount = async (collectionId, ownerId) => {
	const client = await nearIndexerPool.connect();
	const sqlStr = `
	SELECT
		COUNT(receipts.receipt_id)
	FROM
		receipts
	RIGHT JOIN action_receipt_actions ON receipts.receipt_id = action_receipt_actions.receipt_id
	RIGHT JOIN execution_outcomes ON receipts.receipt_id = execution_outcomes.receipt_id
	LEFT JOIN transaction_actions ON transaction_actions.transaction_hash = receipts.originated_from_transaction_hash
	WHERE
		action_receipt_actions.receipt_receiver_account_id = '${config.paras.nft_contract}' and
		action_receipt_actions.receipt_predecessor_account_id = '${config.nft_contract}' and
		action_receipt_actions.args -> 'method_name' = 'nft_mint' and
		action_receipt_actions.args -> 'args_json' ->> 'receiver_id' = '${ownerId}' and
		transaction_actions.args -> 'args_json' ->> 'collection_id' = '${collectionId}' and
      	execution_outcomes.status != 'FAILURE'
	`
	const res = await client.query(sqlStr);
	client.release();
	return res.rows[0].count
}



module.exports = {
	getTxn,
	getParasTokenPerOwnerCount
};

