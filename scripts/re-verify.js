// Create a new client instance
const userInfos = require('../pkg/models/object/user_infos');
//const client = require('./service/discord_bot');
const userUtils = require('../pkg/utils/user_utils');

// Load config info
const client = require("../service/discord_bot.js")
client.on("ready", async () => {
    const users = await userInfos.getUsers({
        guild_id: '942411087251398727',
    });
    console.log(users)
    for (const user of users) {
        const args = { guild_id: user.guild_id, user_id: user.user_id };
        const accountId = user.near_wallet_id;
        userUtils.setUser(args, accountId);
    }
    process.exit(0);
})