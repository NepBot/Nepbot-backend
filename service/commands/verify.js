const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../../pkg/utils/config');
const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const logger = require('../../pkg/utils/logger');
const discordUtils = require('../../pkg/utils/discord_utils');

const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Verify your on-chain assets')
	.setDescription(`Click the button below to complete the near wallet authorization operation.\n
	This link is only valid for 5 mins. If the link expires, please use the command again to get a new link.`);

const button = new MessageButton()
	.setLabel('Connect Near Wallet')
	.setStyle('LINK');

const action = new MessageActionRow()
	.addComponents(button);

const data = new SlashCommandBuilder()
	.setName('verify')
	.setDescription('Connect your NEAR wallet to verify your on-chain assets on Near protocol.');

const execute = async interaction => {
	const nonce = Date.now();
	const signature = await nearUtils.getSign({
		nonce: nonce,
		user_id: interaction.user.id,
		guild_id: interaction.guildId,
	});
	// Set the url
	button.setURL(`${config.wallet_auth_url}/verify/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&sign=${signature}`);

	await userInfos.addUser({
		user_id: interaction.user.id,
		guild_id: interaction.guildId,
		nonce: nonce,
	});
	// store data into mysql
	logger.debug('saving user info...');
	// replay message to discord user
	await interaction.reply({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
	discordUtils.setInteraction(interaction)
};

module.exports = {
	data,
	execute,
};