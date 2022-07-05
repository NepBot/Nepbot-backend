const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const config = require('../../pkg/utils/config');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const content = new MessageEmbed()
	.setDescription(`Click the button below to enter the NFT setting page.\n
	This link is only valid for 5 mins. If the link expires, please use the command again to get a new link.`)
	.setColor('BLUE');

const button = new MessageButton().setStyle('LINK').setLabel('Create NFT Collection');

const action = new MessageActionRow().addComponents(button);

const data = new SlashCommandBuilder()
	.setName('createnft')
	.setDescription('Create a NFT collection or add collectibles to existing collections');

const execute = async interaction => {
	const { ownerId } = interaction.guild;
	const userId = interaction.user.id;
	if (userId === ownerId) {
		const nonce = Date.now();
		const sign = await nearUtils.getSign({
			nonce: nonce,
			user_id: interaction.user.id,
			guild_id: interaction.guildId,
		});
		await userInfos.addUser({
			user_id: interaction.user.id,
			guild_id: interaction.guildId,
			nonce: nonce,
		});
		button.setURL(`${config.wallet_auth_url}/collectionlist/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&sign=${sign}`);
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
			embeds:[new MessageEmbed().setDescription('This command can only be used by server owner.').setColor('RED')],
			ephemeral:true,
		});
	}
};

module.exports = {
	data,
	execute,
};
