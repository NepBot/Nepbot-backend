
const {client} = require("../../bot");

exports.getMember = (guildId,memberId)=>{
    const guild = this.getGuild(guildId)
    for (member of guild.members.cache) {
        console.log(member.user.id)
        if (member.user.id == memberId) {
            console.log("found+++++++++++++++++++++++=")
        }
    }
    return guild.members.cache.get(memberId);
}
exports.getGuild = (guid_id)=>{
   return client.guilds.cache.get(guid_id)
}

exports.getRoles = (guid_id,role_id)=>{
    if(role_id){
        return client.guilds.cache.get(guid_id).roles.cache.get(role_id);
    }
    return client.guilds.cache.get(guid_id).roles.cache;
}
