const {Client, Intents} = require('discord.js');
const client = new Client({ intents:[Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_TYPING] })
const { events } = require('./interaction')
const {msgFunc} = require("./message");
client.on('ready',async (data)=>{
    process.env.botData = JSON.stringify(data);
    regeistryCommands()
});
/**
 * Listen for interaction
 * */

client.on('guildCreate', async (interaction) => {
    console.log('guildCreate')
    await events(interaction);
})

client.on('guildDelete', async (interaction) => {
    console.log('guildDelete')
    await events(interaction);
})

client.on('interactionCreate', async (interaction) => {
    await events(interaction);
})

client.on('messageCreate', async (msg) => {

    await msgFunc(msg,client)
});

const regeistryCommands = async () => {
    client.application.commands.create({
        name: "oauth",
        type: "CHAT_INPUT",
        description: "Replies with user walletAuthorization"
    }) //, "940255224256409611")
    client.application.commands.create({
        name: "setrule",
        type: "CHAT_INPUT",
        description: "Replies with user walletAuthorization"
    })



    // new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    // new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
    // new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
    // new SlashCommandBuilder().setName('set').setDescription('Replies with user permissions!'),
    // new SlashCommandBuilder().setName('oauth').setDescription('Replies with user walletAuthorization').addStringOption(option => option.setName('nearwalletid').setDescription('Enter a near wallet id')),
    // new SlashCommandBuilder().setName('roles').setDescription('Replies with set roles').addStringOption(option => option.setName('member').setDescription('Set a role for the user')),
    // new SlashCommandBuilder().setName('setrule').setDescription('Replies with set rule')
}



module.exports = {client};
