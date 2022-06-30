const logger = require('../../pkg/utils/logger');
const Resp = require('../../pkg/models/object/response');
const indexer_utils = require('../../pkg/utils/indexer_utils');

/* POST method income structrue:
	{
		args: {xxx}      //maybe another signature here, used for link verifaction or operate verification
		account_id: String   //near account
        sign: String    //account id verification, args signature signed by this account
	}
*/

/**
 * based on the request return txn
 * @api /api/get-txn-by-rule
 * @method Post
 * @param role_id, guild_id, key_field
 * @example {
 *   "role_id":"988755310351093760",
 *   "guild_id":"940255224256409611",
 *   "key_field": [
 *		"paras-token-v2.testnet",
 *		"2dverse-test-by-agitarsatestnet"
 *	]
 *}
 * @returns txn
 */
const getTxnByRule = async (ctx, next) => {
	const params = ctx.params;
	logger.info(`revice request by access 'api/getTxByRule': ${JSON.stringify(params)}`);
	ctx.body = new Resp({
		data: await indexer_utils.getTxn(params),
	});
};

module.exports = {
	'GET /api/getTxByRule': getTxnByRule,
};