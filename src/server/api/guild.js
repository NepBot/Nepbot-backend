
const {client} = require("../../bot");

exports.getMember = (guildId,memberId)=>{
    console.log("id", memberId)
    const guild = this.getGuild(guildId)
    for (let key in guild.members.cache) {
        console.log(key)
    }
    return guild.members.cache.get(user);
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
