const userInfos = require('../../pkg/models/object/user_infos');
const astrodao_utils = require('../../pkg/utils/astrodao_utils');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const logger = require('../../pkg/utils/logger');

const data = new SlashCommandBuilder()
  .setName('vote')
  .setDescription('List the active proposal for the dao')
  .addStringOption(option =>
    option.setName('address')
      .setDescription('The Astrodao Contract Address')
      .setRequired(true));

const selectMenu = new MessageSelectMenu()
  .setCustomId('action.astrodao')
  .setPlaceholder('Nothing selected');

const action = new MessageActionRow().addComponents(selectMenu);


const execute = async interaction => {
  selectMenu.options = [];
  const address = interaction.options.get('address').value;
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
  const activeProposals = await astrodao_utils.getActiveProposals(address);
  const descriptions = [];

  for (const proposal of activeProposals) {
    try {
      descriptions.push('Proposal Id: ' + proposal.id + '\n' + proposal.description.split('$$$')[0]);
      const formatProposal = await astrodao_utils.formatProposal(proposal);
      const value = { proposal_id: proposal.id, contract_addr: address };
      // every properties in selectMenu.options must be in 100 or fewer in length.
      selectMenu.addOptions(
        { label: `Proposal Id: ${proposal.id} Type: ${formatProposal.proposal_type}`,
          description: proposal.description.split('$$$')[0].substring(0, 100),
          value: JSON.stringify(value),
        },
      );
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
    components: [action],
  });
};

module.exports = {
  data,
  execute,
};
