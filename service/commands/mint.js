const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const config = require('../../pkg/utils/config');

const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { getNFTMintableRoles, getCollectionsByGuild } = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');

const content = new MessageEmbed().setDescription('Click the button below to mint NFT directly').setColor('BLUE');

const button = new MessageButton().setStyle('LINK').setLabel('Mint NFT');

const action = new MessageActionRow().addComponents(button);

const data = new SlashCommandBuilder()
	.setName('mint')
	.setDescription('Replies the server info')
	.addStringOption(option =>
		option.setName("collection")
			.setDescription('the collection you want to mint')
			.setRequired(true));

const execute = async interaction => {
	try {
		
	
	const { ownerId } = interaction.guild;
	const userId = interaction.user.id;
	const option = interaction.options.get("collection").value
	
	const collections = await getCollectionsByGuild(interaction.guildId)
	const index = collections.findIndex(item => item.collection_id.split("-")[0] == option)
	if(index == -1) {
		interaction.reply({
			content:'\n',
			embeds:[new MessageEmbed().setDescription('Wrong collection name').setColor('RED')],
			ephemeral:true,
		});
		return
	}
	let canMint = false
	const collectionId = collections[index].collection_id
	const mintableRoles = await getNFTMintableRoles(collectionId)
	const member = await discordUtils.getMember(interaction.guildId, userId)
	
	
	if (!mintableRoles) {
		canMint = true
	} else {
		for (let role of mintableRoles) {
			if (member._roles.includes(role)) {
				canMint = true
				break
			}
		}
	}
	if (canMint || ownerId == userId) {
		const nonce = Date.now();
		const sign = await nearUtils.getSign({
			nonce: nonce,
			user_id: interaction.user.id,
			guild_id: interaction.guildId,
			collection_id: collectionId,
		});
		await userInfos.addUser({
			user_id: interaction.user.id,
			guild_id: interaction.guildId,
			nonce: nonce,
		});
		button.setURL(`${config.wallet_auth_url}/mint/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&collection_id=${collectionId}&sign=${sign}`);
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
}
catch (e) {
	console.log(e)
}
};

module.exports = {
	data,
	execute,
};
