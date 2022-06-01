const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');

const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Near Wallet Authorization')
	.setDescription(`Welcome to join this guild.\n 
  Please use the button below for completing the near wallet authorization operation`);

const button = new MessageButton()
	.setCustomId('NearConnect')
	.setLabel('Connect Near Wallet')
	.setStyle('SECONDARY');

const action = new MessageActionRow()
	.addComponents(button);

const execute = async guild => {
	// create nepbot-join channel
	if (isChannelExists(guild, 'nepbot-join')) {
		await guild.channels.create('nepbot-join',
			{ permissionOverwrites: [
				{
					id: guild.roles.everyone,
					allow: [Permissions.FLAGS.VIEW_CHANNEL],
					deny: [Permissions.FLAGS.SEND_MESSAGES],
				},
			] });
		const channelId = guild.channels.cache.find(channel => channel.name === 'nepbot-join').id;
		const channel = guild.client.channels.cache.get(channelId);
		await channel.send({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
	}

	// create server owner channle
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