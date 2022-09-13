const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../../pkg/utils/config');
const nearUtils = require('../../../pkg/utils/near_utils');
const airdropUtils = require('../../../pkg/utils/airdrop_utils');
const userInfos = require('../../../pkg/models/object/user_infos');
const logger = require('../../../pkg/utils/logger');

const button = new MessageButton()
  .setLabel('Redeem FT')
  .setStyle('LINK');

const action = new MessageActionRow()
  .addComponents(button);


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

  // if (await airdropUtils.checkClaimed(userId)) {
  //   return interaction.reply({
  //     content:'\n',
  //     embeds:[new MessageEmbed()
  //       .setDescription('You already claimed this FT.')],
  //     ephemeral:true,
  //     components:[action],
  //   });
  // }

  const embedMsg = await airdropUtils.formatFTEmbedMsg(interaction);

  const nonce = Date.now();
  const sign = await nearUtils.getSign({
    nonce: nonce,
    user_id: userId,
    guild_id: interaction.guildId,
    channel_id: interaction.channelId,
    role_id: embedMsg.role_id,
    contract_address: embedMsg.contract_address,
    token_id: embedMsg.token_id,
    total_amount: embedMsg.total_amount,
    amount_per_share: embedMsg.amount_per_share,
    end_time: embedMsg.end_time,
  });

  await userInfos.addUser({
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    nonce: nonce,
  });
  button.setURL(`${config.wallet_auth_url}/ftredeem/?user_id=${userId}&channel_id=${interaction.channelId}&guild_id=${interaction.guildId}&role_id=${embedMsg.role_id}&contract_address=${embedMsg.contract_address}&token_id=${embedMsg.token_id}&total_amount=${embedMsg.total_amount}&amount_per_share=${embedMsg.amount_per_share}&end_time=${embedMsg.end_time}&sign=${sign}`);

  interaction.reply({
    content:'\n',
    embeds:[new MessageEmbed()
      .setDescription('Please use the the following button to redeem your token.')],
    ephemeral:true,
    components:[action],
  });
};

module.exports = {
  execute,
};