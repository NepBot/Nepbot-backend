const twitterRule = require('../../pkg/models/object/twitter_rules');
const logger = require('../../pkg/utils/logger');
const twitterUsers = require('../../pkg/models/object/twitter_users');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('set_twitter_rule')
  .setDescription('Set twitter rules for roles in this server.')
  .addStringOption(option =>
    option.setName('rule_type')
      .setDescription('The rule type that the user need finished.')
      .setRequired(true)
      .addChoices(
        { name: 'Retweet', value: 'retweet' },
        { name: 'Follow', value: 'follow' },
      ))
  .addStringOption(option =>
    option.setName('role_id')
      .setDescription('which role the user can join')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('tweet_id')
      .setDescription('the tweet id can find in http link, when click a tweet on twitter')
      .setRequired(false));


const execute = async interaction => {
  const { ownerId } = interaction.guild;
  const userId = interaction.user.id;
  const ruleType = interaction.options.get('rule_type').value;
  const roleId = interaction.options.get('role_id').value;
  const guildId = interaction.guildId;
  const twitterUser = await twitterUsers.get({ guild_id: guildId, user_id: userId });

  if (userId != ownerId) {
    return await interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed().setDescription('This command can only be used by server owner.').setColor('RED')],
      ephemeral:true,
    });
  }
  else if (!twitterUser) {
    return await interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed().setDescription('You have not verify twitter account.\n Using /verify_twitter to verify.').setColor('RED')],
      ephemeral:true,
    });
  }
  if (ruleType == 'retweet') {
    try {
      const tweetId = interaction.options.get('tweet_id').value;
      await twitterRule.add({
        guild_id: guildId,
        user_id: userId,
        role_id: roleId,
        type: ruleType,
        tweet_id: tweetId,
      });
      await interaction.reply({
        content:'\n',
        embeds:[new MessageEmbed().setDescription('Set twitter rule success.\n Using command: \'/list_twitter_rule\' to check.')],
        ephemeral:true,
      });
    }
    catch (e) {
      interaction.reply({
        content:'\n',
        ephemeral:true,
        embeds:[new MessageEmbed().setDescription(`Tweet_id can't not be null.\n 
        The tweet id can find in http link, when click a tweet on twitter.\n
        For example, the link 'https://twitter.com/pluwen/status/1564844510613360640', 1564844510613360640 is the tweet id.`)],
      });
    }
  }
  else if (ruleType == 'follow') {
    try {
      await twitterRule.add({
        guild_id: guildId,
        user_id: userId,
        role_id: roleId,
        type: ruleType,
      });
      await interaction.reply({
        content:'\n',
        embeds:[new MessageEmbed().setDescription('Set twitter rule success.\n Using command: \'/list_twitter_rule\' to check.')],
        ephemeral:true,
      });
    }
    catch (e) {
      logger.error(e);
    }
  }
};

module.exports = {
  data,
  execute,
};
