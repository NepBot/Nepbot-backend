const client = require('../../service/discord_bot');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');
const config = require('./config');
const { ThreadChannel } = require('discord.js');
const replies = {};
const rest = new REST({ version: '9' }).setToken(config.bot_token);

exports.getMember = async (guildId, userId) => {
  const guild = await this.getGuild(guildId);
  return await guild.members.fetch(userId);
};

exports.getGuild = async (guildId) => {
  return await client.guilds.fetch(guildId);
};

// this.getMember('966966468774350948', '912438768043196456').then(e => console.log(e.guild.id));

exports.getRoles = async (guildId, roleId) => {
  const guild = await this.getGuild(guildId);
  if (roleId) {
    const role = await guild.roles.fetch(roleId);
    return role;
  }
  return await guild.roles.fetch();
};

exports.getOwnerId = async (guildId) => {
  const guild = await this.getGuild(guildId);
  return guild.ownerId;
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

exports.getMemberNameById = async (guildId, userId) => {
  const guild = await this.getGuild(guildId);
  return await guild.members.fetch(userId).user.username;
};

/**
 *
 * @param {string} guildId
 * @param {string} userId
 * @param {String} roleId
 * @returns boolean
 */
exports.isMemberIncludeRole = async (guildId, userId, roleId) => {
  const guild = await this.getGuild(guildId);
  const member = await guild.members.fetch(userId);
  return await member._roles.includes(roleId);
};

// this.isMemberIncludeRole('966966468774350948', '912438768043196456', '1004439142899396638').then(console.log);

/**
 * 
 * @param {string} guildId;
 * @param {string} roleId;
 * @returns a map of GuildMember
 */
exports.getMembersInRole = async (guildId, roleId) => {
  const role = await this.getRoles(guildId, roleId);
  return role.members;
};

//this.getMembersInRole('966966468774350948', '1021984493285933126').then(console.log);

exports.getChannel = async (guildId, channelId) => {
  const guild = await this.getGuild(guildId);
  return guild.channels.fetch(channelId);
};