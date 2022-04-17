
const {client} = require("../../bot");
const fs = require("fs")

exports.getMember = (guildId,memberId)=>{
    const guild = this.getGuild(guildId)
    fs.writeFileSync("./haha.txt", JSON.stringify(guild.members.cache))
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
