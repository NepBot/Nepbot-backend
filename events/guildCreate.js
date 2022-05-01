module.exports = {
	name: 'guildCreate',
	execute(guild) {
		guild.channels.create(`${guild.name}`);
	},
};