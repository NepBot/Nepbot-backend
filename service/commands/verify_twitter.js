const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const discordUtils = require('../../pkg/utils/discord_utils');
const twitterUtils = require('../../pkg/utils/twitter_utils');
const twitterUsers = require('../../pkg/models/object/twitter_users');

const embed = new MessageEmbed()
  .setColor('#0099ff')
  .setTitle('Verify your twitter account')
  .setDescription(`Click the button below to complete the twitter authorization operation.\n
	This link is only valid for 5 mins. If the link expires, please use the command again to get a new link.`);

const button = new MessageButton()
  .setLabel('Connect Twitter')
  .setStyle('LINK');

const action = new MessageActionRow()
  .addComponents(button);

const data = new SlashCommandBuilder()
  .setName('verify_twitter')
  .setDescription('Connect your twitter account to establish the connection with discord.');

const execute = async interaction => {
  // const nonce = Date.now();
  // const signature = await nearUtils.getSign({
  //   nonce: nonce,
  //   user_id: interaction.user.id,
  //   guild_id: interaction.guildId,
  // });
  // // Set the url
  // button.setURL(`${config.wallet_auth_url}/verify/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&sign=${signature}`);
  const twitterUser = await twitterUsers.get({ guild_id: interaction.guildId, user_id: interaction.user.id });
  if (twitterUser) {
    await interaction.reply({ content: 'You cant verify 2 twitter account.', ephemeral:true });
    return;
  }
  button.setURL(await twitterUtils.generateOAuthLink(interaction.guildId, interaction.user.id));
  // replay message to discord user
  await interaction.reply({ content: '\n', ephemeral:true, embeds:[embed], components: [action] });
  discordUtils.setInteraction(interaction);
};

module.exports = {
  data,
  execute,
};