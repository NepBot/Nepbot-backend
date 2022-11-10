const astrodaoUtils = require('../../pkg/utils/astrodao_utils');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../../pkg/utils/logger');

const data = new SlashCommandBuilder()
  .setName('vote')
  .setDescription('Vote for a DAO proposal with DAO contract and proposal ID.')
  .addStringOption(option =>
    option.setName('contract_address')
      .setDescription('The Astrodao Contract Address')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('proposal_id')
      .setDescription('The proposal id')
      .setRequired(true))
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
  const proposalId = interaction.options.get('proposal_id').value;
  let messageType = false;
  if (interaction.options.get('message_type')?.value != undefined) {
    messageType = interaction.options.get('message_type').value == 'private' ? true : false;
  }
  const proposal = await astrodaoUtils.getProposal(address, proposalId);
  const afterProposal = await astrodaoUtils.formatProposal(proposal);

  const approve = new MessageButton()
    .setCustomId('action.for')
    .setStyle('SECONDARY')
    .setLabel('👍 For');

  const against = new MessageButton()
    .setCustomId('action.against')
    .setStyle('SECONDARY')
    .setLabel('👎 Against');

  const content = new MessageEmbed();

  const action = new MessageActionRow()
    .addComponents(approve, against);
  // Generate sign and main info for the both of the button
  content.addFields({ name: 'Contract Address', value: address });
  for (const field of afterProposal.embeds) {
    content.addFields(field);
  }
  await interaction.reply({
    content:'\n',
    ephemeral: messageType,
    embeds: [content],
    components: [action],
  });
};

module.exports = {
  data,
  execute,
};
