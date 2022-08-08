// Create a new client instance
const userInfos_utils = require('../pkg/models/object/user_infos');
//const client = require('./service/discord_bot');
const user_utils = require('../pkg/utils/user_utils');

// Load config info
const client = require("../service/discord_bot.js")
client.on("ready", async () => {
    const userInfos = await userInfos_utils.getUsers({
        guild_id: '942411087251398727',
    });
    for (const userInfo of userInfos) {
        const args = { guild_id: userInfo.guild_id, user_id: userInfo.user_id };
        const accountId = userInfo.near_wallet_id;
        user_utils.setUser(args, accountId);
    }
    process.exit(0);
})