const { Permissions } = require('discord.js');

const execute = async guild => {
	if (isChannelExists(guild, 'nepbot-join')) {
		guild.channels.create('nepbot-join');
	}
	const owner = await guild.fetchOwner();
	const ownerName = owner.user.username;
	if (isChannelExists(guild, ownerName)) {
		guild.channels.create(`${ownerName}-private`,
			{ permissionOverwrites: [
				{
					id: guild.roles.everyone,
					deny: [Permissions.FLAGS.VIEW_CHANNEL],
				},
			] });
	}
};

module.exports = {
	name: 'guildCreate',
	execute,
};

const isChannelExists = (guild, channelName) => {
	const channelInGuild = guild.channels.cache.find(channel => channel.name === channelName);
	if (channelInGuild === undefined) {
		return true;
	}
	return false;
};