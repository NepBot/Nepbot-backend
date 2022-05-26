const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../../pkg/utils/config');
const nearUtils = require('../../pkg/utils/near_utils');
const userInfos = require('../../pkg/models/object/user_infos');
const logger = require('../../pkg/utils/logger');

const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Near Wallet Authorization');

const button = new MessageButton()
	.setLabel('Connect Near Wallet')
	.setStyle('LINK');

const action = new MessageActionRow()
	.addComponents(button);

const execute = async member => {
	const nonce = Date.now();
	const memberId = member.id;
	const guildId = member.guild.id;
	const channelId = member.guild.channels.cache.find(channel => channel.name === 'nepbot-join').id;
	const channel = member.client.channels.cache.get(channelId);
	const signature = await nearUtils.getSign({
		nonce: nonce,
		user_id: memberId,
		guild_id: guildId,
	});
	// Set the url
	button.setURL(`${config.wallet_auth_url}/verify/?user_id=${memberId}&guild_id=${guildId}&sign=${signature}`);

	await userInfos.addUser({
		user_id: memberId,
		guild_id: guildId,
		nonce: nonce,
	});
	// store data into mysql
	logger.debug('saving user info...');
	// replay message to discord user
	embed.setDescription(`Hello <@${memberId}>.\n
  Welcome to join this guild.\n 
  Please find the button below for completing the near wallet authorization operation`);
	await channel.send({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
};

module.exports = {
	name: 'guildMemberAdd',
	execute,
};