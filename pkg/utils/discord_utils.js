const client = require('../../service/discord_bot');
const { GuildMember } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const rest = require('../../deploy-commands');

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
