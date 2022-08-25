const userInfos = require('../../pkg/models/object/user_infos');
const astrodao_utils = require('../../pkg/utils/astrodao_utils');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../../pkg/utils/logger');

const data = new SlashCommandBuilder()
  .setName('checkproposal')
  .setDescription('List the active proposal for the dao')
  .addStringOption(option =>
    option.setName('contract_address')
      .setDescription('The Astrodao Contract Address')
      .setRequired(true));


const execute = async interaction => {
  const address = interaction.options.get('contract_address').value;
  const userId = interaction.user.id;
  const userInfo = await userInfos.getUser({
    guild_id: interaction.guildId,
    user_id: userId,
  });
  // if the user doesn't connect to any near wallet, it will reply the following content.
  if (!userInfo.near_wallet_id.trim()) {
    interaction.reply({
      content:'You are not connected to any Near wallet.',
      ephemeral: true,
    });
    // break hear;
    return;
  }
  logger.debug(`The address is ${address}`);
  const activeProposals = await astrodao_utils.listActiveProposals(address);
  const descriptions = [];

  if (activeProposals.length == 0) {
    await interaction.reply({
      content:'There is no more active proposal.\n',
      ephemeral: true,
    });
  }
  for (const proposal of activeProposals) {
    try {
      descriptions.push('Proposal Id: ' + proposal.id + '\n' + proposal.description.split('$$$')[0]);
    }
    catch (e) {
      logger.error(e);
      continue;
    }
  }
  const content = new MessageEmbed().setDescription(`All active proposal with ${address} are: \n${descriptions.join('\n')}`);
  await interaction.reply({
    content:'\n',
    ephemeral: true,
    embeds: [content],
  });
};

module.exports = {
  data,
  execute,
};
