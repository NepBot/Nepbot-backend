const logger = require('../../pkg/utils/logger');
const config = require('../../pkg/utils/config');
const airdropUtils = require('../../pkg/utils/airdrop_utils');
const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const nftApprove = new MessageButton()
  .setLabel('Approve')
  .setStyle('LINK');

const action = new MessageActionRow()
  .addComponents(nftApprove);

const data = new SlashCommandBuilder()
  .setName('nft_airdrop')
  .setDescription('Airdrop a specify NFT.')
  .addRoleOption(option => option.setName('receiver_role').setDescription('which role the user can claim').setRequired(true))
  .addStringOption(option => option.setName('contract_address').setDescription('Input the contract address.').setRequired(true))
  .addStringOption(option => option.setName('token_id').setDescription('NFT token_id').setRequired(true))
  .addIntegerOption(option => option.setName('duration').setDescription('x days').setRequired(true));

const execute = async interaction => {
  const { ownerId } = interaction.guild;
  const userId = interaction.user.id;
  if (userId != ownerId) {
    return await interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed().setDescription('This command can only be used by server owner.').setColor('RED')],
      ephemeral:true,
    });
  }

  const roleId = interaction.options.get('receiver_role').value;
  const roleName = await interaction.guild.roles.fetch(roleId).then(e => e.name);
  const contractAddress = interaction.options.get('contract_address').value;
  const tokenId = interaction.options.get('token_id').value;
  const duration = interaction.options.get('duration').value;
  const endTime = await airdropUtils.getGMTTime(duration);

  const content = new MessageEmbed()
    .setDescription('Approve: The airdrop creator can use this button to approve Nepbot get the permission to transfer the NFT.')
    .addFields(
      { name: 'Receiver_role', value: '@' + roleName },
      { name: 'Contract_address', value: contractAddress },
      { name: 'Token_id', value: tokenId },
      { name: 'End_time(GMT)', value: endTime },
    );

  const nonce = Date.now();
  const sign = await nearUtils.getSign({
    nonce: nonce,
    user_id: userId,
    guild_id: interaction.guildId,
    role_id: roleId,
    contract_address: contractAddress,
    token_id: tokenId,
    end_time: endTime,
  });

  await userInfos.addUser({
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    nonce: nonce,
  });
  nftApprove.setURL(`${config.wallet_auth_url}/nftapprove/?user_id=${userId}&channel_id=${interaction.channelId}&guild_id=${interaction.guildId}&role_id=${roleId}&contract_address=${contractAddress}&token_id=${tokenId}&end_time=${endTime}&sign=${sign}`);

  interaction.reply({
    content:'\n',
    embeds:[content],
    ephemeral:true,
    components:[action],
  });
};

module.exports = {
  data,
  execute,
};
