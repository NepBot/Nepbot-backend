const client = require('../../service/discord_bot');
const { GuildMember, Guild } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const rest = require('../../deploy-commands');
const config = require('./config');
const replies = {};

exports.getMember = async (guildId, memberId) => {
  const member = await rest.get(`${Routes.guildMember(guildId, memberId)}`, {
    auth:true,
  });
  return new GuildMember(client, member, this.getGuild(guildId));
};

exports.getGuild = async (guild_id) => {
  let guild = client.guilds.cache.get(guild_id);
  console.log(guild)
  if (!guild) {
    guild = await rest.get(`${Routes.guild(guildId)}`)
    guild = new Guild(client, guild)
  }
  return guild
};

exports.getRoles = (guid_id, role_id) => {
  if (role_id) {
    return client.guilds.cache.get(guid_id).roles.cache.get(role_id);
  }
  return client.guilds.cache.get(guid_id).roles.cache;
};

exports.getOwnerId = (guild_id) => {
  return client.guilds.cache.get(guild_id).ownerId;
};

exports.addSubCommand = (guildId, commandId, command) => {
  return new Promise((resolve, reject) => {
    rest.put(Routes.applicationCommands(config.bot_appid, guildId, commandId), { body: command });
  });
};

exports.getBotUser = () => {
  return client.user;
};

exports.getBotGuildChannel = (guild) => {
  const res = client.channels.cache.find(channel => channel.name == 'nepbot-joinnn');
  for (channel of client.channels.cache.values()) {
    console.log(channel);
  }
  return res;
};

clearReplies = () => {
  for (const key in replies) {
    const reply = replies[key];
    if (Date.now() - reply.timestamp > 300 * 1000) {
      delete replies[key];
    }
  }
};

exports.getInteraction = (userId, guildId) => {
  return replies[String(userId) + String(guildId)].interaction;
};

exports.setInteraction = (interaction) => {
  clearReplies();
  replies[String(interaction.user.id) + String(interaction.guildId)] = {
    interaction: interaction,
    timestamp: Date.now(),
  };
};

exports.getMemberInGuild = async (guildId, userId) => {
  const guild = await this.getGuild(guildId);
  return await guild.members.fetch(userId);
};
