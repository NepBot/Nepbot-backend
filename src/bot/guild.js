const {MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require("../utils/config").getConfig();
const secret = require("../utils/secret").getSecret();
const {CLIENT_ID, GUILD ,walletAuthUrl} = config;
const {TOKEN} = secret
/**
 * commands init
 * */

/** commands response*/
const onGuildAdd = async (guild) => {
    guild.commands.create({
        name: "oauth",
        type: "CHAT_INPUT",
        description: "Replies with user walletAuthorization"
    }) //, "940255224256409611")
    guild.commands.create({
        name: "setrule",
        type: "CHAT_INPUT",
        description: "Replies with user walletAuthorization"
    })
}


module.exports = {
    onGuildAdd
}
