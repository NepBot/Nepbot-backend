const logger = require('../../pkg/utils/logger');
const Resp = require('../../pkg/models/object/response');
const nearUtils = require('../../pkg/utils/near_utils');
const userUtils = require('../../pkg/utils/user_utils');
const discordUtils = require('../../pkg/utils/discord_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const { MessageEmbed } = require('discord.js');

const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Verify success')
	.setDescription(``);


const setInfo = async (ctx, next) => {
	const req = ctx.request.body;
	const args = req.args;
	logger.info(`revice request by access 'api/setInfo': ${JSON.stringify(req)}`);
	// verify user account
	if (!await nearUtils.verifyAccountOwner(req.account_id, args, req.sign)) {
		logger.error('fn verifyAccountOwner failed in api/setInfo');
		ctx.body = new Resp({
			code: 500,
			message: 'fn verifyAccountOwner failed in api/getOwnerSign',
			success: false,
		});
		return;
	}
	// verify user id
	if (!await userUtils.verifyUserId({user_id: args.user_id, guild_id: args.guild_id}, args.sign)) {
		logger.error('fn verifyUserId failed in api/setInfo');
		ctx.body = new Resp({
			code: 500,
			message: 'fn verifyUserId failed in api/getOwnerSign',
			success: false,
		});
		return;
	}

	await userUtils.setUser(args, req.account_id)

	const interaction = discordUtils.getInteraction(args.user_id, args.guild_id)
	if (interaction) {
		await interaction.editReply({content: '\n', ephemeral:true, embeds:[embed], components: [] })
	}

	ctx.body = new Resp({});
};

const disconnectAccount = async (ctx, next) => {
	const args = ctx.request.body;
	logger.info(`revice request by access 'api/disconnectAccount': ${JSON.stringify(args)}`);
	// verify user account
	// verify user id
	if (!await userUtils.verifyUserSign({user_id: args.user_id, guild_id: args.guild_id}, args.sign)) {
		logger.error('fn verifyUserId failed in api/disconnectAccount');
		ctx.body = new Resp({
			code: 500,
			message: 'fn verifyUserId failed in api/disconnectAccount',
			success: false,
		});
		return;
	}

	await userInfos.updateUser({
		user_id: args.user_id, 
		guild_id: args.guild_id,
		near_wallet_id: null
	})
	ctx.body = new Resp({});
}

module.exports = {
	'POST /api/setInfo': setInfo,
	'POST /api/disconnectAccount': disconnectAccount,
};