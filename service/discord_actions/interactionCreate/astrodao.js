const logger = require('../../../pkg/utils/logger');
const userInfos = require('../../../pkg/models/object/user_infos');
const astrodao_utils = require('../../../pkg/utils/astrodao_utils');
const nearUtils = require('../../../pkg/utils/near_utils');
const config = require('../../../pkg/utils/config');

const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');

const approve = new MessageButton()
  .setStyle('LINK')
  .setLabel('👍 For');

const against = new MessageButton()
  .setLabel('👎 Against')
  .setStyle('LINK');

const content = new MessageEmbed();

const action = new MessageActionRow()
  .addComponents(approve, against);

const execute = async interaction => {
  const value = JSON.parse(interaction.values[0]);
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

  // If the user already voted to with the proposal
  const policy = await astrodao_utils.getAstrodaoPolicy(value.contract_addr);
  const proposal = await astrodao_utils.getProposal(value.contract_addr, value.proposal_id);
  const isAlreadyVote = await astrodao_utils.isAlreadyVote(proposal, userInfo.near_wallet_id);
  if (isAlreadyVote) {
    approve.setDisabled();
    against.setDisabled();
    content.setDescription(`You already voted this proposal\n${JSON.stringify(proposal)}`);
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
  const checkPermission = await astrodao_utils.checkPermissions(policy, afterProposal, userInfo.near_wallet_id);
  content.setDescription(afterProposal.description);
  if (!checkPermission) {
    approve.setDisabled();
    against.setDisabled();
    content.setDescription(`You don't have permission to vote this proposal\n${JSON.stringify(proposal)}`);
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
  const approveSign = await nearUtils.getSign({
    nonce: nonce,
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    proposal_id: value.proposal_id,
    action: 'VoteApprove',
  });
  const approveUrl = `${config.wallet_auth_url}/vote/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&proposal_id=${value.proposal_id}&action=VoteApprove&sign=${approveSign}`;
  approve.setURL(approveUrl);
  logger.info(`${interaction.user.tag} in #${interaction.channel.name} generate an approve button\n ${approveUrl}`);

  const againstSign = await nearUtils.getSign({
    nonce: nonce,
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    proposal_id: value.proposal_id,
    action: 'VoteReject',
  });
  const againstUrl = `${config.wallet_auth_url}/vote/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&proposal_id=${value.proposal_id}&action=VoteReject&sign=${againstSign}`;
  against.setURL(againstUrl);
  logger.info(`${interaction.user.tag} in #${interaction.channel.name} generate an against button\n ${againstUrl}`);
  await interaction.reply({
    content:'\n',
    ephemeral: true,
    embeds: [content],
    components: [action],
  });
};

module.exports = {
  execute,
};
