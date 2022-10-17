const logger = require('../../pkg/utils/logger');
const airdropUtils = require('../../pkg/utils/airdrop_utils');
const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const config = require('../../pkg/utils/config');


const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const send = new MessageButton()
  .setLabel('Airdrop')
  .setStyle('LINK');

const action = new MessageActionRow()
  .addComponents(send);

const data = new SlashCommandBuilder()
  .setName('ft_airdrop')
  .setDescription('Airdrop a specify token.')
  .addRoleOption(option => option.setName('receiver_role').setDescription('which role the user can claim').setRequired(true))
  .addStringOption(option => option.setName('token_contract').setDescription('Input the token contract').setRequired(true))
  .addStringOption(option => option.setName('total_amount').setDescription('Input total amount').setRequired(true))
  .addStringOption(option => option.setName('amount_per_share').setDescription('every person can get').setRequired(true))
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
  const roleName = await interaction.guild.roles.fetch(roleId).then(e => e.name.split('@').at(-1));
  const tokenContract = interaction.options.get('token_contract').value;
  const totalAmount = interaction.options.get('total_amount').value;
  const amountPerShare = interaction.options.get('amount_per_share').value;
  const duration = interaction.options.get('duration').value;
  const endTime = await airdropUtils.getGMTTime(duration);

  const content = new MessageEmbed()
    .setDescription('/ft_airdrop : Airdrop a specific fungible token (NEP-141) on NEAR.')
    .addFields(
      { name: 'Receiver_role', value: '@' + roleName },
      { name: 'Token_Contract', value: tokenContract },
      { name: 'Total_amount', value: totalAmount },
      { name: 'Amount_per_share', value: amountPerShare },
      { name: 'End_time(GMT)', value: endTime },
    );
  const nonce = Date.now();
  const sign = await nearUtils.getSign({
    nonce: nonce,
    user_id: userId,
    channel_id: interaction.channelId,
    guild_id: interaction.guildId,
    role_id: roleId,
    token_contract: tokenContract,
    total_amount: totalAmount,
    amount_per_share: amountPerShare,
    end_time: endTime,
  });

  await userInfos.addUser({
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    nonce: nonce,
  });
  send.setURL(`${config.wallet_auth_url}/ftairdrop/?user_id=${userId}&channel_id=${interaction.channelId}&guild_id=${interaction.guildId}&role_id=${roleId}&token_contract=${tokenContract}&total_amount=${totalAmount}&amount_per_share=${amountPerShare}&end_time=${endTime}&sign=${sign}`);

  await interaction.reply({
    content:'\n',
    embeds:[content],
    components: [action],
    ephemeral:true,
  });
};

module.exports = {
  data,
  execute,
};
