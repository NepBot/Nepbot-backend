const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../../pkg/utils/config');
const near_utils = require('../../pkg/utils/near_utils');
const user_infos = require('../../pkg/models/object/user_infos');
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

const data = new SlashCommandBuilder()
	.setName('verify')
	.setDescription('Replies the server info');

const execute = async interaction => {
	const nonce = Date.now();
	const signature = await near_utils.getSign({
		guild_id: interaction.guildId,
		nonce: nonce,
		user_id: interaction.user.id,
	});
	// Set the url
	button.setURL(`${config.wallet_auth_url}/verify/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&sign=${signature}`);
	const user = await user_infos.findOne({
		user_id: interaction.user.id,
		guild_id: interaction.guildId
	})
	console.log(user)
	// store data into mysql
	if (user) {
		await user_infos.update({
			nonce: nonce,
		}, {
			where: {
				user_id: interaction.user.id,
				guild_id: interaction.guildId
			}
		})
	} else {
		const saveUserInfo = await user_infos.create({
			user_id: interaction.user.id,
			guild_id: interaction.guildId,
			nonce: nonce,
		});
		logger.debug(`saving user info...|${saveUserInfo.toJSON()}`);
	}
	
	
	// replay message to discord user
	await interaction.reply({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
};

module.exports = {
	data,
	execute,
};