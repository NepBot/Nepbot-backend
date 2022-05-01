const near_utils = require('../pkg/utils/near_utils');
const user_infos = require('../pkg/models/object/user_infos');
const config = require('../pkg/utils/config');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const content = new MessageEmbed().setDescription('Click the button below to enter the setting rules page').setColor('BLUE');

const button = new MessageButton().setStyle('LINK').setLabel('Set Rule');

const action = new MessageActionRow().addComponents(button);

const data = new SlashCommandBuilder()
	.setName('set_rule')
	.setDescription('Replies the server info');

const execute = async interaction => {
	const { ownerId } = interaction.guild;
	const userId = interaction.user.id;
	if (userId === ownerId) {
		const nonce = Date.now();
		const sign = await near_utils.getSign({
			guild_id: interaction.guildId,
			nonce: nonce,
			user_id: interaction.user.id,
		});
		await user_infos.update({
			user_id: interaction.user.id,
			guild_id: interaction.guildId,
			nonce: nonce,
		});
		await user_infos.save();
		button.setURL(`${config.wallet_auth_url}/setrule/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&sign=${sign}`);
		interaction.reply({
			content:'\n',
			embeds:[content],
			ephemeral:true,
			components:[action],
		});
	}
	else {
		interaction.reply({
			content:'\n',
			embeds:[new MessageEmbed().setDescription('You do not have permission to operate this command').setColor('RED')],
			ephemeral:true,
		});
	}
};

module.exports = {
	data,
	execute,
};
