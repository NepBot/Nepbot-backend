const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const config = require('../../pkg/utils/config');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { getNFTMintableRoles, getCollectionsByGuild } = require('../../pkg/utils/contract_utils');

// const content = new MessageEmbed().setDescription('Click the button below to enter the NFT setting page').setColor('BLUE');

// const button = new MessageButton().setStyle('LINK').setLabel('Create NFT Collection');

// const action = new MessageActionRow().addComponents(button);

const data = new SlashCommandBuilder()
	.setName('listcollections')
	.setDescription('Replies the server info');

const execute = async interaction => {
	const { ownerId } = interaction.guild;
	const userId = interaction.user.id;

    const collections = await getCollectionsByGuild(interaction.guildId)
    let collectionNames = []
    if (collections.length > 0) {
        for (collection of collections) {
            collectionNames.push(collection.collection_id.split(":")[1].split("-guild-")[0].replaceAll("-", " "))
        }
        const content = new MessageEmbed().setDescription(`Collections In This Server:\n${collectionNames.join("\n")}`)
        interaction.reply({
            content:'\n',
            embeds:[content],
            ephemeral:true,
        });
    } else {
        interaction.reply({
			content:'\n',
			embeds:[new MessageEmbed().setDescription('No Collection').setColor('RED')],
			ephemeral:true,
		});
    }
};

module.exports = {
	data,
	execute,
};
