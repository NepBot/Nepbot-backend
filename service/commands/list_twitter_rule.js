const twitterRules = require('../../pkg/models/object/twitter_rules');
const logger = require('../../pkg/utils/logger');
const twitterUsers = require('../../pkg/models/object/twitter_users');

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('list_twitter_rule')
  .setDescription('List twitter rules for roles in this server.');

const execute = async interaction => {
  const content = new MessageEmbed();
  const guildId = interaction.guildId;
  const { ownerId } = interaction.guild;
  const listTwitterRules = await twitterRules.list({
    guild_id: guildId,
  });
  if (!listTwitterRules) {
    await interaction.reply({
      content:'You haven\'t set any twitter rule.',
      ephemeral:true,
    });
  }
  for (const twitterRule of listTwitterRules) {
    try {
      if (twitterRule.tweet_id) {
        content.addFields({ name: `${twitterRule.type}  ${twitterRule.tweet_id}`, value: JSON.stringify(twitterRule) });
      }
      else {
        const twitterUser = await twitterUsers.get({ guild_id: guildId, user_id: ownerId });
        content.addFields({ name: `${twitterRule.type} ${twitterUser.twitter_username}`, value: JSON.stringify(twitterRule) });
      }
    }
    catch (e) {
      logger.error(e);
      continue;
    }
  }
  await interaction.reply({
    content:'\n',
    embeds:[content],
    ephemeral:true,
  });
};

module.exports = {
  data,
  execute,
};
