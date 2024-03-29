const userInfos = require('../../pkg/models/object/user_infos');
const astrodao_utils = require('../../pkg/utils/astrodao_utils');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const logger = require('../../pkg/utils/logger');

const data = new SlashCommandBuilder()
  .setName('check_proposal')
  .setDescription('List active proposal; Nepbot will automatically set a range from last 25 proposals')
  .addStringOption(option =>
    option.setName('contract_address')
      .setDescription('The Astrodao Contract Address')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('from')
      .setDescription('The from index tell Nepbot from which number to get proposal')
      .setRequired(false))
  .addIntegerOption(option =>
    option.setName('to')
      .setDescription('The to index tell Nepbot which position should stop to get proposal')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('message_type')
      .setDescription('Displays the result in a private or public message.')
      .setRequired(false)
      .addChoices(
        { name: 'Private', value: 'private' },
        { name: 'Public', value: 'public' },
      ));


const execute = async interaction => {
  const address = interaction.options.get('contract_address').value;
  const userId = interaction.user.id;
  const userInfo = await userInfos.getUser({
    guild_id: interaction.guildId,
    user_id: userId,
  });
  // if the user doesn't connect to any near wallet, it will reply the following content.
  if (!userInfo.near_wallet_id) {
    await interaction.reply({
      content:'You are not connected to any Near wallet.',
      ephemeral: true,
    });
    // break hear;
    return;
  }
  logger.debug(`The address is ${address}`);
  let fromIndex = 0;
  let limit = 0;
  let activeProposals = [];
  let messageType = false;
  if (interaction.options.get('message_type')?.value != undefined) {
    messageType = interaction.options.get('message_type').value == 'private' ? true : false;
  }

  try {
    fromIndex = interaction.options.get('from').value;
    limit = interaction.options.get('to').value;
    if (limit < fromIndex) {
      await interaction.reply({
        content:`The argument TO: ${limit} is less than FROM: ${fromIndex}`,
        ephemeral: true,
      });
      return;
    }
    activeProposals = await astrodao_utils.listActiveProposals(address, fromIndex, limit - fromIndex);
  }
  catch (e) {
    logger.debug(e);
    const lastProposalId = await astrodao_utils.getLastProposalId(address);
    if (lastProposalId <= 25) {
      activeProposals = await astrodao_utils.listActiveProposals(address, 0, lastProposalId);
    }
    else {
      activeProposals = await astrodao_utils.listActiveProposals(address, lastProposalId - 25, 25);
    }
  }

  if (activeProposals.length == 0) {
    await interaction.reply({
      content:'There is no more active proposal.\n',
      ephemeral: true,
    });
    return;
  }
  const content = new MessageEmbed().setTitle(`AstroDao Contract Address:\n${address}`);
  for (const proposal of activeProposals) {
    try {
      content.addFields({ name: `Proposal Id: ${proposal.id}`, value: proposal.description.split('$$$')[0] });
    }
    catch (e) {
      logger.error(e);
      continue;
    }
  }

  try {
    await interaction.reply({
      content:'\n',
      ephemeral: messageType,
      embeds: [content],
    });
  }
  catch (e) {
    logger.error(e);
  }
};

module.exports = {
  data,
  execute,
};
