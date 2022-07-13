// Load config info
const config = require('./pkg/utils/config');
const logger = require('./pkg/utils/logger');
const guildCreate = require('./service/events/guildCreate');
const { Client, Intents } = require('discord.js');
const intents = [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS];
// Create a new client instance
const client = new Client({ intents: intents });

client.on('ready', async () => {
	const guilds = client.guilds.cache.values();
	for (const guild of guilds) {
		logger.info(`sync the newest description in ${ guild.name } ...`);
		await guildCreate.execute(guild);
		logger.info(`sync finished in ${ guild.name }.`);
	}
	process.exit(0);
});
// Run discord bot
client.login(config.bot_token);
