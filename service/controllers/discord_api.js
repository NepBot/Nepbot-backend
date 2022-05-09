const Resp = require('../../pkg/models/object/response');
const discordUtils = require('../../pkg/utils/discord_utils');
const nearUtils = require('../../pkg/utils/near_utils');

const getRole = async (ctx, next) => {
	const guildId = ctx.params.guildId;
	const roles = discordUtils.getRoles(guildId);
	ctx.body = new Resp({ data: roles });
};

const getServer = async (ctx, next) => {
	const guildId = ctx.params.guildId;
	const serverList = discordUtils.getGuild(guildId);
	ctx.body = new Resp({ data: serverList });
};

const getUser = async (ctx, next) => {
	const guildId = ctx.params.guildId;
	const userId = ctx.params.userId;
	const member = await discordUtils.getMember(guildId, userId);
	ctx.body = new Resp({ data: member });
};

const getOwnerSign = async (ctx, next) => {
	const req = ctx.request.body;
	const ownerId = await discordUtils.getOwnerId(req.guild_id);
	if (req.user_id == ownerId) {
		const sign = await nearUtils.getSign({
			account_id: req.account_id,
			timestamp: Date.now(),
		});
		ctx.body = new Resp({ data: sign });
	}
	else {
		ctx.body = new Resp({
			code: 200,
			message: `currently user is not owner, ${req.user_id}`,
			success: true,
		});
	}
};
// 2.验证用户是否有权限mint, 具体逻辑：查看用户所属的roles, 判断这些roles是否包含在collection中的mintable_roles中，返回这个人的near_account_id加timestamp的签名

module.exports = {
	'GET /api/getRole/:guildId': getRole,
	'GET /api/getServer/:guildId': getServer,
	'GET /api/getUser/:guildId/:userId': getUser,
	'POST /api/get-owner-sign': getOwnerSign,
};