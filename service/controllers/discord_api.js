const Resp = require('../../pkg/models/object/response');
const discordUtils = require('../../pkg/utils/discord_utils');
const userInfos = require('../../pkg/models/object/user_infos');

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

const getConnectedAccount = async (ctx, next) => {
	const guildId = ctx.params.guildId;
	const userId = ctx.params.userId;
	const userInfo = await userInfos.getUser({
		guild_id: guildId,
		user_id: userId,
	});
	ctx.body = new Resp({data: userInfo.near_wallet_id})
}

module.exports = {
	'GET /api/getRole/:guildId': getRole,
	'GET /api/getServer/:guildId': getServer,
	'GET /api/getUser/:guildId/:userId': getUser,
	'GET /api/getConnectedAccount/:guildId/:userId': getConnectedAccount
};