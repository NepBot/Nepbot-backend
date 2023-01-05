const twitterRule = require('../../pkg/models/object/twitter_rules');
const logger = require('../../pkg/utils/logger');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const button = new MessageButton()
  .setCustomId('action.verify_twitter')
  .setLabel('Verify Twitter')
  .setStyle('PRIMARY');

const disconnect = new MessageButton()
  .setCustomId('action.disconnect_twitter')
  .setLabel('Disconnect Twitter')
  .setStyle('SECONDARY');

const action = new MessageActionRow()
  .addComponents(button, disconnect);

const data = new SlashCommandBuilder()
  .setName('set_twitter_rule')
  .setDescription('Set twitter rules for roles in this server.')
  .addRoleOption(option => option.setName('role').setDescription('which role the user can join').setRequired(true))
  .addStringOption(option => option.setName('follow_username').setDescription('Input the Username without @. Using \'+\' to septate different username, like a + b').setRequired(false))
  .addStringOption(option => option.setName('rt_tweet_link').setDescription('Using \'+\' to septate different link, like a + b').setRequired(false))
  .addStringOption(option => option.setName('like_tweet_link').setDescription('Using \'+\' to septate different link, like a + b').setRequired(false));
const execute = async interaction => {
  try {

  
  const { ownerId } = interaction.guild;
  const userId = interaction.user.id;
  if (userId != ownerId) {
    return await interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed().setDescription('This command can only be used by server owner.').setColor('RED')],
      ephemeral:true,
    });
  }

  const content0 = new MessageEmbed()
    .setDescription(`Click the button below to get verified with your Twitter account. You'll be automatically assigned with the role if you meet the requirements.`);

  const guildId = interaction.guildId;
  const roleId = interaction.options.get('role').value;
  const roleName = await interaction.guild.roles.fetch(roleId).then(e => e.name.split('@').at(-1));
  let followUserName = '';
  let rtTweetLink = '';
  let likeTweetLink = '';
  const content1 = new MessageEmbed().setDescription('**Requirements:**')
  const content2 = new MessageEmbed()
  try {
    followUserName = interaction.options.get('follow_username').value;
    content.addFields({ name: 'Follow', value: followUserName.split('+').map(e => '@' + e.trim()).join(', ') });
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
  content.addFields({ name: 'To Unlock Role', value: `@${roleName}` });

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
    embeds:[content0, content1, content2],
    components: [action],
  });
  } catch (e) {
    console.log(e)
  }
};

module.exports = {
  data,
  execute,
};
