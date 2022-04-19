const {MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require("../config").getConfig();
const secret = require("../secret").getSecret();
const {CLIENT_ID, GUILD ,walletAuthUrl} = config;
const {TOKEN} = secret
/**
 * commands init
 * */

/** commands response*/
const onGuildAdd = async (guild) => {
    let bot = JSON.parse(process.env.botData);
    bot = guild.members.cache.get(bot.user);
    const [role] = bot.roles.cache.map(item=>item).filter(item=>item.name!=='@everyone');
}


module.exports = {
    onGuildAdd
}
