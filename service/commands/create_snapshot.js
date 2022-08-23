const nearUtils = require('../../pkg/utils/near_utils');
const config = require('../../pkg/utils/config');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../../pkg/utils/logger');

const content = new MessageEmbed()
  .setColor('BLUE');

const button = new MessageButton().setStyle('LINK').setLabel('Create snapshot');

const action = new MessageActionRow().addComponents(button);

const data = new SlashCommandBuilder()
  .setName('create_snapshot')
  .setDescription('Create a snapshot based on currently block_height and your contract_address')
  .addStringOption(option =>
    option.setName('address')
      .setDescription('The Contract Address')
      .setRequired(true));

const execute = async interaction => {
  const contractAddress = interaction.options.get('address').value;
  const userId = interaction.user.id;
  if (interaction.member.guild.ownerId != userId) {
    interaction.reply({
      content:'Only the guild owner can create snapshot.',
      ephemeral: true,
    });
    // break hear;
    return;
  }
  const nonce = Date.now();
  const sign = await nearUtils.getSign({
    nonce: nonce,
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    contract_address: contractAddress,
  });
  button.setURL(`${config.wallet_auth_url}/createsnapshot/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&contract_address=${contractAddress}&sign=${sign}`);
  content.setDescription(`Click the button below to create a snapshot.\n
	This link is only valid for 5 mins. If the link expires, please use the command again to get a new link.\n
  Please have a double check that you are going to create a snapshot for ${contractAddress}`);
  await interaction.reply({
    content:'\n',
    ephemeral: true,
    embeds: [content],
    components: [action],
  });
};

module.exports = {
  data,
  execute,
};
