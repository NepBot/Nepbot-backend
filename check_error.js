// Load config info
const config = require('./pkg/utils/config');
const { Client, Intents } = require('discord.js');
const intents = [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS];
// Create a new client instance
const client = new Client({ intents: intents });
const userUtils = require('./pkg/utils/user_utils')
const discordUtils = require('./pkg/utils/discord_utils.js')

client.on('ready', async () => {
    console.log(client.guilds.cache)
    // await userUtils.setUser({guild_id: "945572846275551232", user_id: "880162299992764449"}, "khunpolkaihom.near")
	process.exit(0);
});
// Run discord bot
client.login(config.bot_token);



