const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');

const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Verify your on-chain assets')
	.setDescription(`1. Click the button below\n
  2. Click on "Verify".\n
  3. Confirm your Discord account and Server, and choose a Near wallet to verify.\n
  4. Connect to your wallet with limited permissions, and the page will be redirected to Discord.\n
  5. Successfully verified!\n 
  *This is a read-only connection. Do not share your private keys. We will never ask for your seed phrase. We will never DM you.*`);

const button = new MessageButton()
	.setCustomId('command.verify')
	.setLabel('Verify')
	.setStyle('SECONDARY');

const action = new MessageActionRow()
	.addComponents(button);

const execute = async guild => {
	const channel = await guild.channels.create('nepbot-join',
		{ permissionOverwrites: [
			{
				id: guild.roles.everyone,
				allow: [Permissions.FLAGS.VIEW_CHANNEL],
				deny: [Permissions.FLAGS.SEND_MESSAGES],
			},
		] });
	await channel.send({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
};
module.exports = {
	execute,
};