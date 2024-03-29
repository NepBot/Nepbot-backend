const config = require('../../../pkg/utils/config');
const { MessageEmbed, MessageActionRow, MessageButton, Permissions } = require('discord.js');
const logger = require('../../../pkg/utils/logger');
const setruleEmbed = new MessageEmbed()
  .setTitle('Set Rule For Roles')
  .setDescription('Click the button below to generate a link to the setrule page.')
  .setColor('PURPLE');

const setruleButton = new MessageButton()
  .setCustomId('command.setrule')
  .setLabel('Set Rule')
  .setStyle('SECONDARY');

const setruleAction = new MessageActionRow()
  .addComponents(setruleButton);

const createnftEmbed = new MessageEmbed()
  .setTitle('Manage NFT Collection')
  .setDescription('Click the button below to generate a link to the NFT collection page.')
  .setColor('PURPLE');

const createnftButton = new MessageButton()
  .setCustomId('command.createnft')
  .setLabel('Create NFT Collection')
  .setStyle('SECONDARY');

const createnftAction = new MessageActionRow()
  .addComponents(createnftButton);

const execute = async guild => {
  try {
  // create server owner channel
    const channelName = 'nepbot-settings';

    const guildChannel = guild.channels.cache.find(channel =>
      channel.name == channelName,
    );

    if (guildChannel) {
      await guildChannel.permissionOverwrites.upsert(config.bot_appid, {
        allow: [Permissions.FLAGS.ADMINISTRATOR],
      });
      const messages = await guildChannel.messages.fetch().then(msg => msg.filter(m => m.author.id === config.bot_appid));
      for (const _value of messages.values()) {
        _value.delete();
      }
      await guildChannel.send({ content: '\n', ephemeral:true, embeds:[setruleEmbed], components: [setruleAction] });
      await guildChannel.send({ content: '\n', ephemeral:true, embeds:[createnftEmbed], components: [createnftAction] });
      return;
    }

    const channel = await guild.channels.create(channelName,
      { permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [Permissions.FLAGS.VIEW_CHANNEL],
        },
        {
          id: config.bot_appid,
          allow: [Permissions.FLAGS.ADMINISTRATOR],
        },
      ] });
    await channel.send({ content: '\n', ephemeral:true, embeds:[setruleEmbed], components: [setruleAction] });
    await channel.send({ content: '\n', ephemeral:true, embeds:[createnftEmbed], components: [createnftAction] });
  }
  catch (e) {
    logger.error(e);
  }
};
module.exports = {
  execute,
};