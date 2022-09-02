const userInfos = require('../../pkg/models/object/user_infos');
const astrodao_utils = require('../../pkg/utils/astrodao_utils');
const config = require('../../pkg/utils/config');
const nearUtils = require('../../pkg/utils/near_utils');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../../pkg/utils/logger');

const data = new SlashCommandBuilder()
  .setName('vote')
  .setDescription('List the active proposal for the dao')
  .addStringOption(option =>
    option.setName('contract_address')
      .setDescription('The Astrodao Contract Address')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('proposal_id')
      .setDescription('The proposal id')
      .setRequired(true));

const approve = new MessageButton()
  .setStyle('LINK')
  .setLabel('👍 For')
  .setURL(`${config.wallet_auth_url}`);

const against = new MessageButton()
  .setLabel('👎 Against')
  .setStyle('LINK')
  .setURL(`${config.wallet_auth_url}`);

const content = new MessageEmbed();

const action = new MessageActionRow()
  .addComponents(approve, against);

const execute = async interaction => {
  const address = interaction.options.get('contract_address').value;
  const proposalId = interaction.options.get('proposal_id').value;
  const userId = interaction.user.id;
  const userInfo = await userInfos.getUser({
    guild_id: interaction.guildId,
    user_id: userId,
  });
  // if the user doesn't connect to any near wallet, it will reply the following content.
  if (!userInfo.near_wallet_id.trim()) {
    await interaction.reply({
      content:'You are not connected to any Near wallet.',
      ephemeral: true,
    });
    // break hear;
    return;
  }

  // If the user already voted to with the proposal
  const policy = await astrodao_utils.getAstrodaoPolicy(address);
  const proposal = await astrodao_utils.getProposal(address, proposalId);
  const isAlreadyVote = await astrodao_utils.isAlreadyVote(proposal, userInfo.near_wallet_id);
  if (isAlreadyVote) {
    approve.setDisabled();
    against.setDisabled();
    content.setTitle('You already voted this proposal\n');
    content.setDescription(JSON.stringify(proposal));
    await interaction.reply({
      content:'\n',
      ephemeral: true,
      embeds: [content],
      components: [action],
    });
    return;
  }


  // Check the user whether have permission to vote.
  const afterProposal = await astrodao_utils.formatProposal(proposal);
  logger.debug(`afterProposal: ${JSON.stringify(afterProposal)}`);
  logger.debug(`policy: ${JSON.stringify(policy)}`);
  logger.debug(`near_wallet_id: ${userInfo.near_wallet_id}`);
  const checkPermission = await astrodao_utils.checkPermissions(policy, afterProposal, userInfo.near_wallet_id);
  logger.debug(`checkPermission: ${checkPermission}`);
  if (!checkPermission) {
    approve.setDisabled();
    against.setDisabled();
    content.setTitle('You don\'t have permission to vote this proposal\n');
    content.setDescription(afterProposal.description);
    await interaction.reply({
      content:'\n',
      ephemeral: true,
      embeds: [content],
      components: [action],
    });
    return;
  }

  // Generate sign and main info for the both of the button
  const nonce = Date.now();
  await userInfos.addUser({
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    nonce: nonce,
  });
  const approveSign = await nearUtils.getSign({
    nonce: nonce,
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    proposal_id: proposalId,
    contract_addr: address,
    action: 'VoteApprove',
  });
  content.setDescription(afterProposal.description);
  const approveUrl = `${config.wallet_auth_url}/vote/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&proposal_id=${proposalId}&contract_address=${address}&action=VoteApprove&sign=${approveSign}`;
  approve.setURL(approveUrl);
  logger.info(`${interaction.user.tag} in #${interaction.channel.name} generate an approve button & url\n ${approveUrl}`);

  const againstSign = await nearUtils.getSign({
    nonce: nonce,
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    proposal_id: proposalId,
    contract_addr: address,
    action: 'VoteReject',
  });
  const againstUrl = `${config.wallet_auth_url}/vote/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&proposal_id=${proposalId}&contract_address=${address}&action=VoteReject&sign=${againstSign}`;
  against.setURL(againstUrl);
  logger.info(`${interaction.user.tag} in #${interaction.channel.name} generate an against button & url\n ${againstUrl}`);
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
