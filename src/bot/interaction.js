const {MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require("../utils/config").getConfig();
const secret = require("../secret").getSecret();
const {walletAuthUrl} = config;
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
        case 'verify':
            const timestamp = Date.now()
            const sign = await getSign({
                guild_id: interaction.guildId,
                timestamp: timestamp,
                user_id: interaction.author.id,  
            })

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Near Wallet Authorization')
                .setDescription('Click the button below to complete the near wallet authorization operation');
            
            
            new MessageButton()
                .setLabel('Connect Near Wallet')
                .setStyle('LINK')
                .setURL(`${walletAuthUrl}/verify/?user_id=${interaction.author.id}&guild_id=${interaction.guildId}&timestamp=${timestamp}&sign=${sign}`)
            
            let button = new MessageActionRow()
                .addComponents(temp)   //Connect Near Wallet
            await interaction.reply({ content: '\n', ephemeral:true,embeds:[embed],components: [button] });
            break;
        case 'setrule':
            if(userId === ownerId) {
                const timestamp = Date.now()
                const sign = await getSign({
                    guild_id: interaction.guildId,
                    timestamp: timestamp,
                    user_id: interaction.author.id,  
                })

                const content = new MessageEmbed().setDescription('Click the button below to enter the setting rules page').setColor('BLUE');
                const button = new MessageActionRow()
                    .addComponents(new MessageButton()
                        .setURL(`${walletAuthUrl}/setrule/?user_id=${msg.author.id}&guild_id=${msg.guildId}&timestamp=${timestamp}&sign=${sign}`)
                        .setStyle('LINK').setLabel('Set Rule'))
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
