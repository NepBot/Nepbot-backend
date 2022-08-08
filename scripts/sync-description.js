


exports.execute = async function () {
  const logger = require('../pkg/utils/logger');
  const guildCreate = require('../service/events/guildCreate');
  const client = require("../service/discord_bot.js")

  client.on('ready', async () => {
    const guilds = client.guilds.cache.values();
    for (const guild of guilds) {
      logger.info(`sync the newest description in ${ guild.name } ...`);
      await guildCreate.execute(guild);
      logger.info(`sync finished in ${ guild.name }.`);
    }
    process.exit(0);
  });
}

exports.params = {
  args: [],
  description: 'update nepbot channels',
}