const {MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require("../config").getConfig();
const {getSign} = require("../utils.js");
const {walletAuthUrl} = config;
const userService = require("../server/services/UserInfoService.js")
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
            const nonce = Date.now()
            const sign = await getSign({
                guild_id: interaction.guildId,
                nonce: nonce,
                user_id: interaction.user.id,  
            })

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Near Wallet Authorization')
                .setDescription('Click the button below to complete the near wallet authorization operation');
            
            
            new MessageButton()
                .setLabel('Connect Near Wallet')
                .setStyle('LINK')
                .setURL(`${walletAuthUrl}/verify/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&sign=${sign}`)
            
            let button = new MessageActionRow()
                .addComponents(temp)   //Connect Near Wallet

            await userService.addUser({
                user_id: interaction.user.id,
                guild_id: interaction.guildId,
                near_wallet_id: "unknown",
                create_time: nonce,
                nonce: nonce
            });

            await interaction.reply({ content: '\n', ephemeral:true,embeds:[embed],components: [button] });
            break;
        case 'setrule':
            if(userId === ownerId) {
                const nonce = Date.now()
                const sign = await getSign({
                    guild_id: interaction.guildId,
                    nonce: nonce,
                    user_id: interaction.user.id,  
                })

                const content = new MessageEmbed().setDescription('Click the button below to enter the setting rules page').setColor('BLUE');
                const button = new MessageActionRow()
                    .addComponents(new MessageButton()
                        .setURL(`${walletAuthUrl}/setrule/?user_id=${interaction.user.id}&guild_id=${interaction.guildId}&sign=${sign}`)
                        .setStyle('LINK').setLabel('Set Rule'))

                userService.updateUser({
                    user_id: interaction.user.id,
                    guild_id: interaction.guildId,
                    nonce: nonce
                })
            
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
    events
}
