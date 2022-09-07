const twitterRule = require('../../pkg/models/object/twitter_rules');
const logger = require('../../pkg/utils/logger');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const button = new MessageButton()
  .setCustomId('action.verify_twitter')
  .setLabel('Verify Twitter')
  .setStyle('PRIMARY');

const action = new MessageActionRow()
  .addComponents(button);

const data = new SlashCommandBuilder()
  .setName('set_twitter_rule')
  .setDescription('Set twitter rules for roles in this server.')
  .addRoleOption(option => option.setName('role').setDescription('which role the user can join').setRequired(true))
  .addStringOption(option => option.setName('follow_user_name').setDescription('Using \'+\' to septate different user name, like a + b').setRequired(false))
  .addStringOption(option => option.setName('rt_tweet_link').setDescription('Using \'+\' to septate different link, like a + b').setRequired(false))
  .addStringOption(option => option.setName('like_tweet_link').setDescription('Using \'+\' to septate different link, like a + b').setRequired(false));
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

  const content = new MessageEmbed()
    .setDescription(`If you already have a verified Twitter account, click the button below to verify that you meet this rule.\n
  If you have not verified a Twitter account, the button generates a verification link, and when you have verified it, click the button again and the Nepbot will start verifying that you have met the conditions.`);

  const guildId = interaction.guildId;
  const roleId = interaction.options.get('role').value;
  const roleName = await interaction.guild.roles.fetch(roleId).then(e => e.name);
  let followUserName = '';
  let rtTweetLink = '';
  let likeTweetLink = '';
  content.addFields({ name: 'Role', value: roleName });
  try {
    followUserName = interaction.options.get('follow_username').value;
    content.addFields({ name: 'Follow', value: followUserName });
  }
  catch (e) {
    logger.debug('no follow_username');
  }
  try {
    rtTweetLink = interaction.options.get('rt_tweet_link').value;
    content.addFields({ name: 'Rt_Tweet', value: rtTweetLink });
  }
  catch (e) {
    logger.debug('no rt_tweet_link');
  }
  try {
    likeTweetLink = interaction.options.get('like_tweet_link').value;
    content.addFields({ name: 'Like_Tweet', value: likeTweetLink });
  }
  catch (e) {
    logger.debug('no like_tweet_link');
  }

  await twitterRule.add({
    guild_id: guildId,
    user_id: userId,
    role_id: roleId,
    follow_user_name: followUserName,
    rt_tweet_link: rtTweetLink,
    like_tweet_link: likeTweetLink,
  });


  await interaction.reply({
    content:'\n',
    embeds:[content],
    components: [action],
  });
};

module.exports = {
  data,
  execute,
};
