const logger = require('../../pkg/utils/logger');
const twitterUsers = require('../../pkg/models/object/twitter_users');
const twitterRules = require('../../pkg/models/object/twitter_rules');
const twitterUtils = require('../../pkg/utils/twitter_utils');
const discordUtils = require('../../pkg/utils/discord_utils');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('verify_twitter_rule')
  .setDescription('verify the rules that your satisfied on twitter.')
  .addStringOption(option =>
    option.setName('rule_type')
      .setDescription('The rule type that the user need finished.')
      .setRequired(true)
      .addChoices(
        { name: 'Retweet', value: 'retweet' },
        { name: 'Follow', value: 'follow' },
      ))
  .addStringOption(option =>
    option.setName('tweet_id')
      .setDescription('the tweet id can find in http link, when click a tweet on twitter')
      .setRequired(false));


const execute = async interaction => {
  const { ownerId } = interaction.guild;
  const userId = interaction.user.id;
  const ruleType = interaction.options.get('rule_type').value;
  const guildId = interaction.guildId;
  const twitterUser = await twitterUsers.get({ guild_id: guildId, user_id: userId });

  if (!twitterUser) {
    return await interaction.reply({
      content:'\n',
      embeds:[new MessageEmbed().setDescription('You have not verify twitter account.\n Using command /verify_twitter to bind your twitter account.').setColor('RED')],
      ephemeral:true,
    });
  }
  if (ruleType == 'retweet') {
    try {
      const tweetId = interaction.options.get('tweet_id').value;
      const userClient = await twitterUtils.getClient(guildId, userId);
      const isUserRetweeted = await twitterUtils.isUserRetweeted(userClient, tweetId, twitterUser.twitter_id);
      if (isUserRetweeted) {
        const listTwitterRules = await twitterRules.list({ guild_id: guildId, user_id: ownerId, tweet_id: tweetId });
        const guildMember = await discordUtils.getMemberInGuild(guildId, userId);
        for (const twitterRule of listTwitterRules) {
          await guildMember.roles.add(twitterRule.role_id).then(logger.info(`${interaction.user.username} add role_id ${twitterRule.role_id} in verify_twitter_rule`)).catch(e => logger.error(e));
        }
        return await interaction.reply({
          content:'\n',
          embeds:[new MessageEmbed().setDescription('Add role success')],
          ephemeral:true,
        });
      }
      await interaction.reply({
        content:'\n',
        embeds:[new MessageEmbed().setDescription(`Your are not retweeted the tweet. Tweet_id: ${tweetId}`)],
        ephemeral:true,
      });
    }
    catch (e) {
      await interaction.reply({
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
      const twitterClient = await twitterUtils.getClient(guildId, userId);
      const ownerTwitterUser = await twitterUsers.get({ guild_id: guildId, user_id: ownerId });
      const isUserFollowing = await twitterUtils.isUserFollowing(twitterClient, twitterUser.twitter_id, ownerTwitterUser.twitter_id);
      const twitterRule = await twitterRules.get({ guild_id: guildId, user_id: ownerId });
      if (isUserFollowing) {
        const guildMember = await discordUtils.getMemberInGuild(guildId, userId);
        await guildMember.roles.add(twitterRule.role_id).then(logger.info(`${interaction.user.username} add role_id ${twitterRule.role_id} in verify_twitter_rule`)).catch(e => logger.error(e));
        return await interaction.reply({
          content:'\n',
          embeds:[new MessageEmbed().setDescription('Add role success.')],
          ephemeral:true,
        });
      }
      await interaction.reply({
        content:'\n',
        embeds:[new MessageEmbed().setDescription(`Your are not following the guild owner. Twitter_username: ${ownerTwitterUser.twitter_username}`)],
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
