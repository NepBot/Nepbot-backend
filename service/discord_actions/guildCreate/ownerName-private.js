const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const setruleEmbed = new MessageEmbed()
	.setDescription(`Click the button below to generate a setting rule link button .\n
The link will be expired in 5 mins.\n
If the link expires, please click the button again to get a new one.`)
	.setColor('BLUE');

const setruleButton = new MessageButton()
	.setCustomId('command.setrule')
	.setLabel('Set Rule')
	.setStyle('SECONDARY');

const setruleAction = new MessageActionRow()
	.addComponents(setruleButton);

const createnftEmbed = new MessageEmbed()
	.setDescription(`Click the button below to generate a NFT setting link button.\n
	The link will expired in 5 mins.\n
  If the link expires, please click the button again to get a new one.`)
	.setColor('BLUE');

const createnftButton = new MessageButton()
	.setCustomId('command.createnft')
	.setLabel('Create NFT Collection')
	.setStyle('SECONDARY');

const createnftAction = new MessageActionRow()
	.addComponents(createnftButton);

const execute = async guild => {
	// create server owner channle
	const owner = await guild.fetchOwner();
	const ownerName = owner.user.username;
	const channelName = `${ ownerName }-private`;
	const channel = await guild.channels.create(channelName,
		{ permissionOverwrites: [
			{
				id: guild.roles.everyone,
				deny: [Permissions.FLAGS.VIEW_CHANNEL],
			},
		] });
	await channel.send({ content: '\n', ephemeral:true, embeds:[setruleEmbed], components: [setruleAction] });
	await channel.send({ content: '\n', ephemeral:true, embeds:[createnftEmbed], components: [createnftAction] });
};
module.exports = {
	execute,
};