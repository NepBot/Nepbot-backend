const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const discordUtils = require('../../../pkg/utils/discord_utils');
const twitterUtils = require('../../../pkg/utils/twitter_utils');
const twitterUsers = require('../../../pkg/models/object/twitter_users');
const logger = require('../../../pkg/utils/logger');

const button = new MessageButton()
  .setLabel('Connect Twitter')
  .setStyle('LINK');

const action = new MessageActionRow()
  .addComponents(button);


const execute = async interaction => {
  const twitterUser = await twitterUsers.get({ guild_id: interaction.guildId, user_id: interaction.user.id });
  let userClient;
  try {
    if (twitterUser && twitterUser.access_token) {
      userClient = await twitterUtils.getClient(interaction.guildId, interaction.user.id);
      await interaction.reply({
        content: '\n',
        embeds:[new MessageEmbed()
          .setDescription(`🟢Twitter Connected
          Nepbot is checking whether you are eligible for the rule. It usually will take a few seconds.
          The role will be assigned to you if you satisfy the requirement.`)],
        ephemeral:true });

      const embed = new MessageEmbed();
      await twitterUtils.verifyTwitterRule(userClient, interaction).forEach(r => embed.addFields(r));
      await interaction.followUp({
        content: '\n',
        embeds:[embed],
        ephemeral:true,
      });
      return;
    }
    button.setURL(await twitterUtils.generateOAuthLink(interaction.guildId, interaction.user.id));
    // replay message to discord user
    await interaction.reply({ content: '\n',
      ephemeral:true,
      embeds:[new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Connect Twitter Account')
        .setDescription(`🔴 Twitter Not Connected\n
      You haven't connected to your twitter account.\n
      Click the button below to connect. You'll be directed to twitter to authorize Nepbot.\n
      Once finished, please use the above button 'Verify Twitter' again to verify if you meet the requirements for the role.`)],
      components: [action],
    });
    discordUtils.setInteraction(interaction);
  }
  catch (e) {
    logger.error(e);
    await twitterUsers.delete({ guild_id: interaction.guildId, user_id: interaction.user.id }).then(logger.info(`delete twitter_user in verify_twitter ${JSON.stringify(twitterUser)}`));
    button.setURL(await twitterUtils.generateOAuthLink(interaction.guildId, interaction.user.id));
    // replay message to discord user
    await interaction.reply({ content: '\n', ephemeral:true, embeds:[new MessageEmbed()
      .setDescription('Because of the Twitter API problem, Nepbot can\'t get the Twitter client.\n Please use the button blow to reverify your twitter.')], components: [action] });
    discordUtils.setInteraction(interaction);
  }
};

module.exports = {
  execute,
};