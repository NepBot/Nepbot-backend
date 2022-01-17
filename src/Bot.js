const {Client, Intents} = require('discord.js');
const client = new Client({ intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] })
const { events } = require('./commands/index')
const {msgFunc} = require("./message");
client.on('ready',async (data)=>{
    process.env.botData = JSON.stringify(data);
});
/**
 * Listen for interaction
 * */
client.on('interactionCreate', async (interaction) => {
    await events(interaction);
})

/**
 * Listen for messages
 * */
client.on('messageCreate', async (msg) => {

    await msgFunc(msg,client)
});



module.exports = {client};
