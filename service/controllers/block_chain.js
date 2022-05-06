const logger = require('../../pkg/utils/logger');
const resp = require('../../pkg/models/object/response');
const near_utils = require('../../pkg/utils/near_utils');
const user_utils = require('../../pkg/utils/user_utils');
const discord_utils = require('../../pkg/utils/discord_utils');

/* POST method income structrue:
	{
		args: {xxx}      //maybe another signature here, used for link verifaction or operate verification
		account_id: String   //near account
        sign: String    //account id verification, args signature signed by this account
	}
*/

// api/get-sign
const fn_getSign = async (ctx, next) => {
	const req = ctx.request.body;
	const args = req.args
	logger.info(`revice request by access 'api/get-sign': ${JSON.stringify(req)}`);
	// verify user account
	if (!await near_utils.verifyAccountOwner(req.account_id, args, req.sign)) {
		logger.error('fn verifyAccountOwner failed in api/get-sign');
		ctx.body = new resp({
			code: 500, 
			message: 'fn verifyAccountOwner failed in api/get-sign',
			success: false,
		});
		return;
	}

	if (!await near_utils.verifyOperationSign(args)) {
		logger.error('fn verifyOperationSign failed in api/get-sign');
		ctx.body = new resp({
			code: 500, 
			message: 'fn verifyOperationSign failed in api/get-sign',
			success: false,
		});
		return;
	}

	const guild = await discord_utils.getGuild(args.guild_id);
	if (args.user_id != guild.ownerId) {
		logger.error('user_id != guild.ownerId');
		ctx.body = new resp({
			code: 500, 
			message: 'user_id != guild.ownerId',
			success: false,
		});
		return;
	}

	const sign = await near_utils.getSign(args.items);
	ctx.body = new resp({data: sign});
};
// api/opearte-sign
const fn_operateSign = async (ctx, next) => {
	const req = ctx.request.body;
	const args = req.args
	if (!await near_utils.verifyAccountOwner(req.account_id, args, req.sign)) {
		return;
	}
	const nonce = await user_utils.verifyUserId(args, args.sign);
	if (!nonce) {
		if (args.operationSign && await near_utils.verifyOperationSign({
			user_id: args.user_id,
			guild_id: args.guild_id,
			sign: args.operationSign,
		})) {
			ctx.body = new resp({data: args.operationSign});
			return;
		}
		ctx.body = new resp({
			code: 500, 
			message: 'nonce expired',
			success: false,
		});
		return;
	}
	const sign = await near_utils.getSign(nonce);
	ctx.body = new resp({data: sign});
};

module.exports = {
	'POST /api/sign': fn_getSign,
	'POST /api/operationSign': fn_operateSign,
};