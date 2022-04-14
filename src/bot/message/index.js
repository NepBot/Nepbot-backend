const {MessageEmbed, MessageButton, MessageActionRow, MessagePayload} = require("discord.js");
const config = require("../../utils/config").getConfig();
const Util = require("discord.js/src/util/Util");
const {getMembers} = require("../../server/api/guild");
const {walletAuthUrl} = config;
const specialWords = '!';
const msgFunc = async (msg,client)=> {
    const guild = client.guilds.cache.get(msg.guildId);
    const userId = msg.author.id;
    let user;
    if(msg.content.startsWith('!')){
        //console.log(msg)
        switch (msg.content) {
            case '!oauth':
                let temp = new MessageButton().setLabel('Connect Near Wallet').setStyle('LINK')
                let testButton = new MessageButton().setLabel('Connect Near Wallet').setStyle('PRIMARY').setCustomId("oauth")

                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle('Near Wallet Authorization')
                    .setDescription('Click the button below to complete the near wallet authorization operation');

                temp.setURL(`${walletAuthUrl}/oauth/?user_id=${msg.author.id}&guild_id=${msg.guildId}`)

                let button = new MessageActionRow()
                    .addComponents(temp, testButton)
                user = client.users.cache.get(userId);
                // let guildMember = await getMembers(msg.guildId, userId)
                // console.log(guildMember)
                let channel = guild.channels.cache.get(msg.channelId)


                let messagePayload = MessagePayload.create(msg, { 
                    content: '\n', 
                    ephemeral: true, 
                    embeds:[embed], 
                    components: [button],
                    reply: {
                        messageReference: msg
                    },
                    // reference: {
                    //     channelId: msg.channelId,
                    //     messageId: msg.id,
                    //     guildId: msg.guildId
                    // } 
                })

                //let res = await channel.send(messagePayload);
                

                let res = await msg.reply(messagePayload)
                console.log(res)
                break;
            case '!setrule':
                user = client.users.cache.get(userId);
                if(userId === guild.ownerId) {
                    const content = new MessageEmbed().setDescription('Click the button below to enter the setting rules page').setColor('BLUE');
                    const button = new MessageActionRow()
                        .addComponents(new MessageButton()
                            .setURL(`${walletAuthUrl}/setrule/?user_id=${msg.author.id}&guild_id=${msg.guildId}`)
                            .setStyle('LINK').setLabel('Set Rule'))
                    // msg.reply('111')
                  user.send({
                        content:'\n',
                        embeds:[content],
                        ephemeral:true,
                        components:[button]
                    })
                } else {
                    user.send({
                        content:'\n',
                        embeds:[new MessageEmbed().setDescription('You do not have permission to operate this command').setColor('RED')],
                        ephemeral:true,
                    })
                }
                break;
            case '!1':
                let bot = JSON.parse(process.env.botData);
                console.log(process.env.botData)
                //console.log(client.guilds)
                bot = client.guilds.cache.get(msg.guildId).members.cache.get(bot.user);
                const [role] = bot.roles.cache.map(item=>item).filter(item=>item.name!=='@everyone');
                //
                // console.log(role[0])
                // console.log(role)
                // role[0].setPosition(0)
                //     .then(updated => console.log(`Role position: ${updated}`))
                //     .catch(console.error);
                //
                // console.log(role[0].position)
                //const guild = client.guilds.cache.get(msg.guildId);
                const roles = client.guilds.cache.get(msg.guildId).roles.cache;
                /*const roles = client.guilds.cache.get(msg.guildId).roles.cache;
                let rolePosition = roles.map(item=>({position:item.position,name:item.name,id:item.id}))
                let sortRole = guild._sortedRoles();
                let updatedItems = [...sortRole.values()];
                let arr = Util.moveElementInArray(updatedItems, role, 3);
                console.log("arr>>>",arr);
                updatedItems = updatedItems.map((r, i) => ({ id: r.id, position: i })).filter(i=>i.position!==0&&i.id!=='922747969483210803');
                console.log(updatedItems)
                const res =  await client.api.guilds(msg.guildId).roles.patch({data:updatedItems});
                console.log(res,msg.guildId)*/
                role.setPosition(2).then(console.log).catch(console.error)
               /* await guild.roles.create({
                    name:"Administrator",
                    permission:[8n],
                    position:guild.roles.cache.size
                })*/
               /* const roles = client.guilds.cache.get(msg.guildId).roles.cache;
                let rolePosition = roles.map(item=>({position:item.position,name:item.name,id:item.id}))
                let sortRole = guild._sortedRoles();
                console.log(sortRole)
              /!*  const compare = (attribute)=> {
                    return (obj1, obj2) =>{
                        const val1 = obj1[attribute];
                        const val2 = obj2[attribute];
                        if (val1 < val2) {
                            return -1;
                        } else if (val1 > val2) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                };
                rolePosition =  rolePosition.sort(compare('position'));
                console.log(rolePosition)

                // for (const item of rolePosition) {
                //     if()
                // }*!/*/



        }
    }
}

module.exports = {
    msgFunc
}
