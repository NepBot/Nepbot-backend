const discordUtils = require('../../../pkg/utils/discord_utils');
const config = require('../../../pkg/utils/config');
const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');

const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Verify your on-chain assets')
	.setDescription(`1. Click the button below.\n
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
	const channelName = 'nepbot-join';
	const guildChannel = guild.channels.cache.find(channel => 
		channel.permissionOverwrites.cache.find(permission => 
			permission.id == config.bot_appid
		)
	)
	if (guildChannel) {
		// const messages = await guildChannel.messages.fetch().then(msg => msg.filter(m => m.author.id === config.bot_appid));
		// for (const _value of messages.values()) {
		// 	_value.delete();
		// }
		console.log(guildChannel)
		await guildChannel.send({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
		return;
	}
	// const channel = await guild.channels.create(channelName,
	// 	{ permissionOverwrites: [
	// 		{
	// 			id: guild.roles.everyone,
	// 			allow: [Permissions.FLAGS.VIEW_CHANNEL],
	// 			deny: [Permissions.FLAGS.SEND_MESSAGES],
	// 		},
	// 		{
	// 			id: config.bot_appid,
	// 			allow: [Permissions.FLAGS.ADMINISTRATOR]
	// 		}
	// 	] });
	// await channel.send({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
};
module.exports = {
	execute,
};