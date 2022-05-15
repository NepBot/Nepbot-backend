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

const getMintSign = async (ctx, next) => {

}

module.exports = {
	'GET /api/getRole/:guildId': getRole,
	'GET /api/getServer/:guildId': getServer,
	'GET /api/getUser/:guildId/:userId': getUser,
	'POST /api/getMintSign': getMintSign
};