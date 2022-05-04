const logger = require('../pkg/utils/logger');
const resp = require('../pkg/models/object/response');
const near_utils = require('../pkg/utils/near_utils');
const user_utils = require('../pkg/utils/user_utils');
const discord_utils = require('../pkg/utils/discord_utils');
// api/get-sign
const fn_getSign = async (ctx, next) => {
	const req = ctx.request.body;
	logger.info(`revice request by access 'api/get-sign': ${JSON.stringify(req)}`);
	// verify user account
	if (!await near_utils.verifyAccountOwner(req.account_id, req, req.sign)) {
		resp.code = 500;
		resp.message = 'fn verifyAccountOwner is faild in api/get-sign';
		resp.success = false;
		resp.data = req;
		logger.error('fn verifyAccountOwner is faild in api/get-sign');
		ctx.body = resp;
		return;
	}

	if (!await near_utils.verifyOperationSign(req)) {
		resp.code = 500;
		resp.message = 'fn verifyOperationSign is faild in api/get-sign';
		resp.success = false;
		resp.data = req;
		logger.error('fn verifyOperationSign is faild in api/get-sign');
		ctx.body = resp;
		return;
	}

	const guild = await discord_utils.getGuild(req.guild_id);
	if (req.user_id != guild.ownerId) {
		resp.code = 500;
		resp.message = 'req.user_id != guild.ownerId';
		resp.success = false;
		resp.data = req;
		logger.error('req.user_id != guild.ownerId');
		ctx.body = resp;
		return;
	}

	const sign = await near_utils.getSign(req.items);
	resp.data = sign;
	ctx.body = resp;
};
// api/opearte-sign
const fn_operateSign = async (ctx, next) => {
	const req = ctx.request.body;
	if (!await near_utils.verifyAccountOwner(req.account_id, req, req.sign)) {
		return;
	}
	const nonce = await user_utils.verifyUserId(req, req.sign);
	if (!nonce) {
		if (req.operationSign && await near_utils.verifyOperationSign({
			user_id: req.user_id,
			guild_id: req.guild_id,
			sign: req.operationSign,
		})) {
			resp.data = req.operationSign;
			ctx.body = resp;
			return;
		}
		return;
	}
	const sign = await near_utils.getSign(nonce);
	resp.data = sign;
	ctx.body = resp;
};

module.exports = {
	'GET /api/sign': fn_getSign,
	'GET /api/operationSign': fn_operateSign,
};