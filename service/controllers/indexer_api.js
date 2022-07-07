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
 * @api /api/getTxByGuild
 * @method Get
 * @param guild_id
 * @example { "guild_id":"940255224256409611" }
 * @returns txn
 */
const getTxnByGuild = async (ctx, next) => {
	const guildId = ctx.params.guildId;
	logger.info(`revice request by access 'api/getTxByGuild': ${guildId}`);
	ctx.body = new Resp({
		data: await indexer_utils.getTxn(guildId),
	});
};

module.exports = {
	'GET /api/getTxByGuild/:guildId': getTxnByGuild,
};