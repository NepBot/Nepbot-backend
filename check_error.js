
// Create a new client instance
const config = require('./pkg/utils/config');
const client = require('./service/discord_bot.js');
client.login(config.bot_token);
const userUtils = require('./pkg/utils/user_utils')

client.on('ready', async () => {
    setTimeout(async () => {
        await userUtils.setUser({guild_id: "945572846275551232", user_id: "880162299992764449"}, "khunpolkaihom.near")
    }, 10000)
});



