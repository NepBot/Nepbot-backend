const {Client, Intents} = require('discord.js');
const client = new Client({ intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_TYPING] })
const { events } = require('./interaction')
const {msgFunc} = require("./message");
const {onGuildAdd} = require("./guild.js")
client.on('ready',async (data)=>{
    process.env.botData = JSON.stringify(data);
    regeistryCommands()
});
/**
 * Listen for interaction
 * */

// client.on('guildCreate', async (interaction) => {
//     console.log('guildCreate')
//     await onGuildAdd(interaction);
// })

// client.on('guildDelete', async (interaction) => {
//     console.log('guildDelete')
//     await events(interaction);
// })

client.on('interactionCreate', async (interaction) => {
    await events(interaction);
})

client.on('messageCreate', async (msg) => {

    await msgFunc(msg,client)
});

const regeistryCommands = async () => {
    client.application.commands.create({
        name: "verify",
        type: "CHAT_INPUT",
        description: "Replies with user walletAuthorization"
    }) //, "940255224256409611")
    client.application.commands.create({
        name: "setrule",
        type: "CHAT_INPUT",
        description: "Replies with user walletAuthorization"
    })
    client.application.commands.delete({
        name: "oauth"
    })
}



module.exports = {client};
