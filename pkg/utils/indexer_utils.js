const nearIndexerPool = require('../models/db_driver/postgre_driver');
const logger = require('./logger');
const config = require('./config');

const getTxn = async args => {
	const client = await nearIndexerPool.connect();
	const sqlStr = `SELECT b.transaction_hash, b.args -> 'args_json' -> 'roles' AS roles FROM
  (SELECT transaction_hash FROM transactions WHERE receiver_account_id = '${ config.rule_contract }') AS a 
  LEFT JOIN transaction_actions AS b ON a.transaction_hash = b.transaction_hash 
  WHERE 
	strpos(b.args, ${args.guild_id}) > -1
  ORDER BY b.args -> 'args_json' -> 'timestamp' desc`;
	const res = await client.query(sqlStr);
	await client.release();
	console.log(res.rows)
	for (const _row of res.rows) {
		for (const _role of _row.roles) {
			if (_role.role_id === args.role_id && _role.guild_id === args.guild_id) {
				for (let i = 0; i < _role.key_field.length; i++) {
					if (_role.key_field[i] === args.key_field[i]) {
						return _row.transaction_hash;
					}
				}
			}
		}
	}
};
module.exports = {
	getTxn,
};

