const {GuildMember} = require('discord.js')
const {rest} = require('../../commands/index');
const {Routes} = require("discord-api-types/v9");
const {config} = require("../../utils/config");
const {client} = require("../../Bot");
const {getAllUser} = require("../services/userService");


console.log("client>>>>",client)
exports.getMembers = async (guildId,memberId = 0)=>{
    console.log(memberId)
    if (memberId){
        const member = await rest.get(`${Routes.guildMember(guildId,memberId)}`,{
            auth:true,
        });
        return new GuildMember(client,member,this.getGuild(guildId))
    }else{
        const allMembers = await rest.get(`${Routes.guildMembers(guildId)}?limit=1000&after=1`,{
            auth:true,
        })
        const guild = this.getGuild(guildId)
        const memberSource = await getAllUser({guild_id:guildId});
        console.log("memberSource>>>",memberSource)

        const memberMap = new Map(memberSource.map(({dataValues})=> ([dataValues.user_id,dataValues])))
        return  allMembers.map(item => {
            if (memberMap.get(item.user.id)) {
                const _member = memberMap.get(item.user.id);
                const member = new GuildMember(client, item, guild);
                if(_member.near_wallet_id){
                    console.log(_member.updatedAt)
                    member.walletId = _member.near_wallet_id;
                    member.update = _member.updatedAt;
                    member.oauthTime = _member.oauth_time;
                    return member;
                }
            }else{
                return 'no'
            }
        }).filter(item=>item!=='no')
    }
}
exports.getGuild = (guid_id)=>{
   return client.guilds.cache.get(guid_id)
}

exports.getRoles = (guid_id,role_id)=>{
    console.log("roles>>>>>>",guid_id,role_id)
    if(role_id){
        return client.guilds.cache.get(guid_id).roles.cache.get(role_id);
    }
    return client.guilds.cache.get(guid_id).roles.cache;
}

// exports.getMembersTokenList = async (walletId)=>{
//     return await axios.get(`${walletId}/likelyTokens`);
// }
