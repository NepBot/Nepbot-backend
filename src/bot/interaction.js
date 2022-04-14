const {MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const config = require("../utils/config").getConfig();
const secret = require("../utils/secret").getSecret();
const {CLIENT_ID, GUILD ,walletAuthUrl} = config;
const {TOKEN} = secret
const rest = new REST({version: '9'}).setToken(TOKEN);
const { addUser, queryUser} = require('../server/services/userService');
/**
 * commands init
 * */

/** commands response*/
const events = async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    const { ownerId } = interaction.guild;
    const userId = interaction.user.id;
    
    switch (commandName) {
        case 'oauth':
            let temp = new MessageButton().setLabel('Connect Near Wallet').setStyle('LINK')

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Near Wallet Authorization')
                .setDescription('Click the button below to complete the near wallet authorization operation');

            const string = interaction.options.getString('nearwalletid');
            if(string && (string.includes('.testnet') ||
                string.includes('.near'))) {
                temp.setURL(`${walletAuthUrl}/?near_wallet=${string}&user_id=${interaction.user.id}&guild_id=${interaction.guild.id}`)
            }else{
                temp.setURL(`${walletAuthUrl}/?&user_id=${interaction.user.id}&guild_id=${interaction.guild.id}`)
            }
            let button = new MessageActionRow()
                .addComponents(temp)   //Connect Near Wallet
            await interaction.reply({ content: '\n', ephemeral:true,embeds:[embed],components: [button] });
            break;
        case 'setrule':
            if(userId === ownerId) {
                const content = new MessageEmbed().setDescription('Click the button below to enter the setting rules page').setColor('BLUE');
                const button = new MessageActionRow()
                       .addComponents(new MessageButton()
                           .setURL(`${walletAuthUrl}/setrule/?guild_id=${interaction.guild.id}&guild_name=${encodeURI(interaction.guild.name)}`)
                           .setStyle('LINK').setLabel('Set Rule'))
                // interaction.reply('111')
                interaction.reply({
                    content:'\n',
                    embeds:[content],
                    ephemeral:true,
                    components:[button]
                })
            } else {
                interaction.reply({
                    content:'\n',
                    embeds:[new MessageEmbed().setDescription('You do not have permission to operate this command').setColor('RED')],
                    ephemeral:true
                })
            }
            break;
    }

}


module.exports = {
    rest,
    events
}
