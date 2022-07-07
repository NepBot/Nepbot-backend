const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const setruleEmbed = new MessageEmbed()
	.setTitle('Set Rule For Roles')
	.setDescription(`Click the button below to generate a link to the setrule page.`)
	.setColor('PURPLE');

const setruleButton = new MessageButton()
	.setCustomId('command.setrule')
	.setLabel('Set Rule')
	.setStyle('SECONDARY');

const setruleAction = new MessageActionRow()
	.addComponents(setruleButton);

const createnftEmbed = new MessageEmbed()
	.setTitle('Manage NFT Collection')
	.setDescription(`Click the button below to generate a link to the NFT collection page.\n`)
	.setColor('PURPLE');

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