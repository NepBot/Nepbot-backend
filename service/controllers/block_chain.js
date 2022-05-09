const logger = require('../../pkg/utils/logger');
const Resp = require('../../pkg/models/object/response');
const nearUtils = require('../../pkg/utils/near_utils');
const userUtils = require('../../pkg/utils/user_utils');
const discordUtils = require('../../pkg/utils/discord_utils');

/* POST method income structrue:
	{
		args: {xxx}      //maybe another signature here, used for link verifaction or operate verification
		account_id: String   //near account
        sign: String    //account id verification, args signature signed by this account
	}
*/

// api/get-sign
const getSign = async (ctx, next) => {
	const req = ctx.request.body;
	const args = req.args;
	logger.info(`revice request by access 'api/get-sign': ${JSON.stringify(req)}`);
	// verify user account
	if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
		logger.error('fn verifyAccountOwner failed in api/get-sign');
		ctx.body = new Resp({
			code: 500,
			message: 'fn verifyAccountOwner failed in api/get-sign',
			success: false,
		});
		return;
	}

	if (!await nearUtils.verifyOperationSign(args)) {
		logger.error('fn verifyOperationSign failed in api/get-sign');
		ctx.body = new Resp({
			code: 500,
			message: 'fn verifyOperationSign failed in api/get-sign',
			success: false,
		});
		return;
	}

	const guild = await discordUtils.getGuild(args.guild_id);
	if (args.user_id != guild.ownerId) {
		logger.error('user_id != guild.ownerId');
		ctx.body = new Resp({
			code: 500,
			message: 'user_id != guild.ownerId',
			success: false,
		});
		return;
	}

	const sign = await nearUtils.getSign(args.items);
	ctx.body = new Resp({ data: sign });
};
// api/opearte-sign
const operateSign = async (ctx, next) => {
	const req = ctx.request.body;
	const args = req.args;
	if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
		return;
	}
	const nonce = await userUtils.verifyUserId(args, args.sign);
	if (!nonce) {
		if (args.operationSign && await nearUtils.verifyOperationSign({
			user_id: args.user_id,
			guild_id: args.guild_id,
			sign: args.operationSign,
		})) {
			ctx.body = new Resp({ data: args.operationSign });
			return;
		}
		ctx.body = new Resp({
			code: 500,
			message: 'nonce expired',
			success: false,
		});
		return;
	}
	const sign = await nearUtils.getSign(nonce);
	ctx.body = new Resp({ data: sign });
};

module.exports = {
	'POST /api/sign': getSign,
	'POST /api/operationSign': operateSign,
};