const userInfos = require('../../pkg/models/object/user_infos');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const data = new SlashCommandBuilder()
	.setName('checkwallet')
	.setDescription('Show the user near wallet list who establish connection with this server.');

const execute = async interaction => {
	const { ownerId } = interaction.guild;
	const userId = interaction.user.id;
	// this command can only be used by the server owner;
	if (userId === ownerId) {
		const _userInfos = await userInfos.getUsers({
			guild_id: interaction.guildId,
		});
		let near_wallet_ids = '';
		for (const _userInfo of _userInfos) {
			near_wallet_ids += _userInfo.dataValues.near_wallet_id + '\n';
		}
		// if the currently server doesn't connecte to any near wallet, it will reply the following content.
		if (!near_wallet_ids.trim()) {
			interaction.reply({
				content:'You are not connected to any Near wallet.',
				ephemeral: true,
			});
			// break hear;
			return;
		}
		interaction.reply({
			content:`${near_wallet_ids}`,
			ephemeral: true,
		});
	}
	else {
		interaction.reply({
			content:'\n',
			embeds:[new MessageEmbed().setDescription('This command can only be used by server owner.').setColor('RED')],
			ephemeral:true,
		});
	}
};

module.exports = {
	data,
	execute,
};
