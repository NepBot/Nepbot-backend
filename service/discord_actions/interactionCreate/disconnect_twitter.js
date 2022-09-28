const { MessageEmbed } = require('discord.js');
const twitterUsers = require('../../../pkg/models/object/twitter_users');
const logger = require('../../../pkg/utils/logger');

const execute = async interaction => {
  const twitterUser = await twitterUsers.delete({ user_id: interaction.user.id });
  if (twitterUser) {
    logger.info(`user ${interaction.user.username} disconnect with twitter in ${interaction.guild.name}`);
    return await interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed().setDescription('🔌 Disconnect Twitter Success.').setColor('GREEN')],
      ephemeral:true,
    });
  }
  else {
    return await interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed().setDescription('You are not connect to any twitter account').setColor('RED')],
      ephemeral:true,
    });
  }
};

module.exports = {
  execute,
};