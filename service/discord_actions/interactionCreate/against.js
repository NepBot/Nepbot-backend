const userInfos = require('../../../pkg/models/object/user_infos');
const astrodao_utils = require('../../../pkg/utils/astrodao_utils');
const config = require('../../../pkg/utils/config');
const nearUtils = require('../../../pkg/utils/near_utils');

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const logger = require('../../../pkg/utils/logger');

const execute = async interaction => {
  const fields = interaction.message.embeds[0].fields;
  let contractAddress, proposalId;
  for (const field of fields) {
    if (config.fields.contract_address.findIndex(item => item == field.name) > -1) {
      contractAddress = field.value;
    }
    else if (config.fields.proposal_id.findIndex(item => item ==field.name) > -1) {
      proposalId = parseInt(field.value);
    }
  }
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

  const vote = new MessageButton()
    .setStyle('LINK')
    .setLabel('vote');

  const content = new MessageEmbed();

  const action = new MessageActionRow()
    .addComponents(vote);

  // If the user already voted to with the proposal
  const policy = await astrodao_utils.getAstrodaoPolicy(contractAddress);
  const proposal = await astrodao_utils.getProposal(contractAddress, proposalId);
  const isAlreadyVote = await astrodao_utils.isAlreadyVote(proposal, userInfo.near_wallet_id);
  if (isAlreadyVote) {
    logger.info(`already voted. contract_address: ${contractAddress}, proposal_id: ${proposalId}, user_wallet: ${userInfo.near_wallet_id}`);
    content.setTitle('You already voted this proposal\n');
    await interaction.reply({
      content:'\n',
      ephemeral: true,
      embeds: [content],
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
    logger.info(`don't have permission. contract_address: ${contractAddress}, proposal_id: ${proposalId}, user_wallet: ${userInfo.near_wallet_id}`);
    content.setTitle('You don\'t have permission to vote this proposal\n');
    await interaction.reply({
      content:'\n',
      ephemeral: true,
      embeds: [content],
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
  content.setDescription(`Confirm your vote **against** Proposal ${proposalId}`);

  const againstSign = await nearUtils.getSign({
    nonce: nonce,
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    proposal_id: proposalId,
    contract_addr: contractAddress,
    action: 'VoteReject',
  });
  const againstUrl = `${config.wallet_auth_url}/vote/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&proposal_id=${proposalId}&contract_address=${contractAddress}&action=VoteReject&sign=${againstSign}`;
  vote.setURL(againstUrl);
  logger.info(`${interaction.user.tag} in #${interaction.channel.name} generate an against button & url\n ${againstUrl}`);
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
