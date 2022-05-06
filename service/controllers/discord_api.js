const resp = require('../../pkg/models/object/response');
const discord_utils = require('../../pkg/utils/discord_utils');

const fn_getRole = async (ctx, next) => {
	const guildId = ctx.params.guildId;
	const roles = discord_utils.getRoles(guildId);
	ctx.body = new resp({data: roles});
};

const fn_getServer = async (ctx, next) => {
	const guildId = ctx.params.guildId;
	const serverList = discord_utils.getGuild(guildId);
	ctx.body = new resp({data: serverList});
};

const fn_getUser = async (ctx, next) => {
	const guildId = ctx.params.guildId;
	const userId = ctx.params.userId;
	const member = await discord_utils.getMember(guildId, userId);
	ctx.body = new resp({data: member});
};

module.exports = {
	'GET /api/getRole/:guildId': fn_getRole,
	'GET /api/getServer/:guildId': fn_getServer,
	'GET /api/getUser/:guildId/:userId': fn_getUser,
};