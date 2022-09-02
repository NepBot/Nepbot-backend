const discordUtils = require('../../../pkg/utils/discord_utils');
const config = require('../../../pkg/utils/config');
const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');

const verifyNearEmbed = new MessageEmbed()
  .setColor('#0099ff')
  .setTitle('Verify your on-chain assets')
  .setDescription(`1. Click the button below.\n
  2. Click on "Verify".\n
  3. Confirm your Discord account and Server, and choose a Near wallet to verify.\n
  4. Connect to your wallet with limited permissions, and the page will be redirected to Discord.\n
  5. Successfully verified!\n 
  *This is a read-only connection. Do not share your private keys. We will never ask for your seed phrase. We will never DM you.*`);

const verifyNearButton = new MessageButton()
  .setCustomId('command.verify')
  .setLabel('Verify')
  .setStyle('SECONDARY');

const verifyNearAction = new MessageActionRow()
  .addComponents(verifyNearButton);

const verifyTwitterEmbed = new MessageEmbed()
  .setTitle('Verify your twitter account')
  .setDescription('Click the button below to generate a link for auth your twitter.')
  .setColor('PURPLE');

const verifyTwitterButton = new MessageButton()
  .setCustomId('command.verify_twitter')
  .setLabel('Verify twitter account')
  .setStyle('SECONDARY');

const verifyTwitterAction = new MessageActionRow()
  .addComponents(verifyTwitterButton);

const execute = async guild => {
  const channelName = 'nepbot-join';
  let guildChannel = guild.channels.cache.find(channel =>
    channel.permissionOverwrites.cache.find(permission =>
      permission.id == config.bot_appid &&
			permission.allow.has(Permissions.FLAGS.VIEW_CHANNEL),
    ),
  );
  if (!guildChannel) {
    guildChannel = guild.channels.cache.find(channel =>
      channel.name == channelName,
    );
    if (guildChannel) {
      await guildChannel.permissionOverwrites.upsert(config.bot_appid, {
        allow: [Permissions.FLAGS.VIEW_CHANNEL],
      });
    }
  }
  if (guildChannel) {
    const messages = await guildChannel.messages.fetch().then(msg => msg.filter(m => m.author.id === config.bot_appid));
    for (const _value of messages.values()) {
      _value.delete();
    }
    await guildChannel.send({ content: '\n', ephemeral:true, embeds:[verifyNearEmbed], components: [verifyNearAction] });
    await guildChannel.send({ content: '\n', ephemeral:true, embeds:[verifyTwitterEmbed], components: [verifyTwitterAction] });
    return;
  }
  const channel = await guild.channels.create(channelName,
    { permissionOverwrites: [
      {
        id: guild.roles.everyone,
        allow: [Permissions.FLAGS.VIEW_CHANNEL],
        deny: [Permissions.FLAGS.SEND_MESSAGES],
      },
      {
        id: config.bot_appid,
        allow: [Permissions.FLAGS.VIEW_CHANNEL],
      },
    ] });
  await channel.send({ content: '\n', ephemeral:true, embeds:[verifyNearEmbed], components: [verifyNearAction] });
  await channel.send({ content: '\n', ephemeral:true, embeds:[verifyTwitterEmbed], components: [verifyTwitterAction] });
};
module.exports = {
  execute,
};