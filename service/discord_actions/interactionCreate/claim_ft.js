const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../../pkg/utils/config');
const nearUtils = require('../../../pkg/utils/near_utils');
const airdropUtils = require('../../../pkg/utils/airdrop_utils');
const discordUtils = require('../../../pkg/utils/discord_utils');
const userInfos = require('../../../pkg/models/object/user_infos');
const logger = require('../../../pkg/utils/logger');

const execute = async interaction => {
  const button = new MessageButton()
    .setLabel('Claim')
    .setStyle('LINK');

  const action = new MessageActionRow()
    .addComponents(button);

  const userId = interaction.user.id;

  const embedMsg = await airdropUtils.formatFTEmbedMsg(interaction);
  console.log(interaction.message.embeds[0])
  console.log(embedMsg)
  const hash = embedMsg.hash
  const campaign = await airdropUtils.getCampaign(hash)
  console.log(campaign)

  if (!campaign) {
    return interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed()
        .setDescription('Campaign not found.')],
      ephemeral:true,
    });
  }

  if (await airdropUtils.checkIsClaimed(userId, hash)) {
    return interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed()
        .setDescription('You already claimed this FT.')],
      ephemeral:true,
    });
  }

  let is_in_role = false
  for (let role_id of campaign.role_ids) {
    if (await discordUtils.isMemberIncludeRole(interaction.guildId, userId, role_id)) {
      is_in_role = true
      break
    }
  }

  if (!is_in_role) {
    return interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed()
        .setDescription(`You are not in this role`).setColor('RED')],
      ephemeral:true,
    });
  }
  

  const nonce = Date.now();
  const sign = await nearUtils.getSign({
    nonce: nonce,
    user_id: userId,
    guild_id: interaction.guildId,
    hash: embedMsg.hash,
  });

  await userInfos.addUser({
    user_id: interaction.user.id,
    guild_id: interaction.guildId,
    nonce: nonce,
  });
  button.setURL(`${config.wallet_auth_url}/ftclaim/?user_id=${userId}&guild_id=${interaction.guildId}&hash=${embedMsg.hash}&sign=${sign}`);

  interaction.reply({
    content:'\n',
    embeds:[new MessageEmbed()
      .setDescription('Please use the the following button to claim your token.').setColor('GREEN')],
    ephemeral:true,
    components:[action],
  });
};

module.exports = {
  execute,
};