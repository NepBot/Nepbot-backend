const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../../pkg/utils/config');
const nearUtils = require('../../../pkg/utils/near_utils');
const airdropUtils = require('../../../pkg/utils/airdrop_utils');
const discordUtils = require('../../../pkg/utils/discord_utils');
const userInfos = require('../../../pkg/models/object/user_infos');
const logger = require('../../../pkg/utils/logger');

const button = new MessageButton()
  .setLabel('Claim NFT')
  .setStyle('LINK');

const action = new MessageActionRow()
  .addComponents(button);


const execute = async interaction => {
  const userId = interaction.user.id;

  // if (await airdropUtils.checkClaimed(userId)) {
  //   return interaction.reply({
  //     content:'\n',
  //     embeds:[new MessageEmbed()
  //       .setDescription('You already claimed this NFT.')],
  //     ephemeral:true,
  //     components:[action],
  //   });
  // }

  const embedMsg = await airdropUtils.formatNFTEmbedMsg(interaction);

  if (embedMsg.role_name != '@everyone' && !await discordUtils.isMemberIncludeRole(interaction.guildId, userId, embedMsg.role_id)) {
    return interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed()
        .setDescription(`You are not in this role: ${embedMsg.role_name}`).setColor('RED')],
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
  button.setURL(`${config.wallet_auth_url}/nftclaim/?user_id=${userId}&guild_id=${interaction.guildId}&hash=${embedMsg.hash}&sign=${sign}`);

  interaction.reply({
    content:'\n',
    embeds:[new MessageEmbed()
      .setDescription('Please use the the following button to claim your NFT.').setColor('GREEN')],
    ephemeral:true,
    components:[action],
  });
};

module.exports = {
  execute,
};