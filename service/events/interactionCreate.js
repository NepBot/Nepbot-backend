const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../pkg/utils/config');
const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const logger = require('../../pkg/utils/logger');

const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Near Wallet Authorization')
	.setDescription('Click the button below to complete the near wallet authorization operation');

const button = new MessageButton()
	.setLabel('Connect Near Wallet')
	.setStyle('LINK');

const action = new MessageActionRow()
	.addComponents(button);

const execute = async interaction => {
	if (interaction.isButton()) {
		const nonce = Date.now();
		const userId = interaction.user.id;
		const signature = await nearUtils.getSign({
			nonce: nonce,
			user_id: userId,
			guild_id: interaction.guildId,
		});
		// Set the url
		button.setURL(`${config.wallet_auth_url}/verify/?user_id=${userId}&guild_id=${interaction.guildId}&sign=${signature}`);

		await userInfos.addUser({
			user_id: userId,
			guild_id: interaction.guildId,
			nonce: nonce,
		});
		// store data into mysql
		logger.debug('saving user info...');
		// replay message to discord user
		embed.setDescription(`Hello <@${userId}>.\n
			Please find the button below for completing the near wallet authorization operation`);
		await interaction.reply({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
		return;
	}
	logger.info(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
};

module.exports = {
	name: 'interactionCreate',
	execute,
};