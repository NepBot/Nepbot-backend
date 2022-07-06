const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const parasUtils = require('../../pkg/utils/paras_api');
const indexerUtils = require('../../pkg/utils/indexer_utils');
const config = require('../../pkg/utils/config');

const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { getNFTMintableRoles, getCollectionsByGuild, getCollectionSeries } = require('../../pkg/utils/contract_utils');
const discordUtils = require('../../pkg/utils/discord_utils');

const content = new MessageEmbed()
	.setDescription(`Click the button below to mint NFT directly.\n
	This link is only valid for 5 mins. If the link expires, please use the command again to get a new link.`)
	.setColor('BLUE');

const button = new MessageButton().setStyle('LINK').setLabel('Mint NFT');

const action = new MessageActionRow().addComponents(button);

const data = new SlashCommandBuilder()
	.setName('mint')
	.setDescription('Mint an NFT from an NFT collection in this server.')
	.addStringOption(option =>
		option.setName('collection')
			.setDescription('the collection you want to mint')
			.setRequired(true));

const execute = async interaction => {

	const { ownerId } = interaction.guild;
	const userId = interaction.user.id;
	const option = interaction.options.get('collection').value;

	const collections = await getCollectionsByGuild(interaction.guildId);
	const index = collections.findIndex(item => item.collection_id.split(':')[1].split('-guild-')[0].replaceAll('-', ' ') == option);
	if (index == -1) {
		interaction.reply({
			content:'\n',
			embeds:[new MessageEmbed().setDescription('Wrong collection name').setColor('RED')],
			ephemeral:true,
		});
		return;
	}

	// check the mint_count_limit in contract
	const collection = collections[index]
	const collectionId = collections[index].collection_id
	const mintCountLimit = collections[index].mint_count_limit;

	if (collection.series_count == 0) {
		if (!user.near_wallet_id) {
			interaction.reply({
				content:'\n',
				embeds:[new MessageEmbed().setDescription(`This is an empty collection`).setColor('RED')],
				ephemeral:true,
			});
			return;
		}
	}

	const series = await getCollectionSeries(collectionId)
	let left_count = 0
	for (s of series) {
		left_count += s.copies - s.minted_count
	}
	if (left_count == 0) {
		interaction.reply({
			content:'\n',
			embeds:[new MessageEmbed().setDescription(`Nothing left`).setColor('RED')],
			ephemeral:true,
		});
		return;
	}

	if (mintCountLimit != null) {
		const user = await userInfos.getUser({
			guild_id: interaction.guildId,
			user_id: userId
		})
		if (!user.near_wallet_id) {
			interaction.reply({
				content:'\n',
				embeds:[new MessageEmbed().setDescription(`Verify your Near wallet first`).setColor('RED')],
				ephemeral:true,
			});
			return;
		}
		const alreadyMintCount = await indexerUtils.getParasTokenPerOwnerCount(collectionId, user.near_wallet_id);
		console.log(alreadyMintCount)
		const restMintNum = parseInt(mintCountLimit) - alreadyMintCount;
		if (restMintNum <= 0 ) {
			interaction.reply({
				content:'\n',
				embeds:[new MessageEmbed().setDescription(`Exceed minting limit of this collection`).setColor('RED')],
				ephemeral:true,
			});
			return;
		}
		
	}

	let canMint = false;
	const mintableRoles = collection.mintable_roles
	const member = await discordUtils.getMember(interaction.guildId, userId);


	if (!mintableRoles) {
		canMint = true;
	}
	else {
		for (const role of mintableRoles) {
			if (member._roles.includes(role)) {
				canMint = true;
				break;
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
			embeds:[new MessageEmbed().setDescription('This command can only be used by server owner.').setColor('RED')],
			ephemeral:true,
		});
	}
};

module.exports = {
	data,
	execute,
};
