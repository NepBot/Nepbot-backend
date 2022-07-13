const client = require('../../service/discord_bot');
const { GuildMember } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const rest = require('../../deploy-commands');
const config = require('./config');

exports.getMember = async (guildId, memberId) => {
	const member = await rest.get(`${Routes.guildMember(guildId, memberId)}`, {
		auth:true,
	});
	return new GuildMember(client, member, this.getGuild(guildId));
};

exports.getGuild = (guild_id) => {
	return client.guilds.cache.get(guild_id);
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

exports.getBotGuildChannel = (guildId) => {
	const res = client.channels.cache.find(channel => channel.guildId == guildId)
	console.log(res)
	return res
}
