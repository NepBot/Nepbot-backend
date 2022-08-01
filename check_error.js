// // Load config info
// const config = require('./pkg/utils/config');
// const logger = require('./pkg/utils/logger');
// const guildCreate = require('./service/events/guildCreate');
// const { Client, Intents } = require('discord.js');
// const intents = [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS];
// // Create a new client instance
// const client = new Client({ intents: intents });

// client.on('ready', async () => {
//     const guild = client.guilds.cache.find(guild => guild.id == '940255224256409611')
//     await guildCreate.execute(guild);
// 	process.exit(0);
// });
// // Run discord bot
// client.login(config.bot_token);

const userUtils = require('./pkg/utils/user_utils')
userUtils.setUser({guild_id: "945572846275551232", user_id: "880162299992764449"}, "khunpolkaihom.near")

