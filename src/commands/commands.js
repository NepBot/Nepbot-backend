const {SlashCommandBuilder} = require("@discordjs/builders");
module.exports = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
    new SlashCommandBuilder().setName('user').setDescription('Replies with user info!'),
    new SlashCommandBuilder().setName('set').setDescription('Replies with user permissions!'),
    new SlashCommandBuilder().setName('oauth').setDescription('Replies with user walletAuthorization').addStringOption(option => option.setName('nearwalletid').setDescription('Enter a near wallet id')),
    new SlashCommandBuilder().setName('roles').setDescription('Replies with set roles').addStringOption(option => option.setName('member').setDescription('Set a role for the user')),
    new SlashCommandBuilder().setName('setrule').setDescription('Replies with set rule')
]
