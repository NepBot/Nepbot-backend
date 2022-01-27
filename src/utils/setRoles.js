exports.setTokenAmountRoles = async (member, rule, tokenAmount) => {
    if (!member._roles.includes(rule.role_id) && tokenAmount >= rule.fields.amount) {
        const _role = getRoles(rule.guild_id, rule.role_id);
        _role && member.roles.add([_role]).then(console.log).catch(console.error)
    }
    if(member._roles.includes(rule.role_id) &&  tokenAmount < rule.fields.amount){
        const _role = getRoles(rule.guild_id, rule.role_id);
        _role && member.roles.remove([_role]).then(console.log).catch(console.error)
    }
}

exports.setOctRoles = async (member, rule, octRole) => {
    if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
        const _role = getRoles(rule.guild_id, rule.role_id);
        _role && member.roles.add([_role]).then(console.log).catch(console.error)
    }
    if(member._roles.includes(rule.role_id) && !octRole == rule.fields.oct_role){
        const _role = getRoles(rule.guild_id, rule.role_id);
        _role && member.roles.remove([_role]).then(console.log).catch(console.error)
    }
}