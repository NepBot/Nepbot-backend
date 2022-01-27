const BN = require('bn.js')

exports.setTokenAmountRoles = async (member, rule, tokenAmount) => {
    console.log(rule, tokenAmount)
    if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.amount)) != -1 ) {
        const _role = getRoles(rule.guild_id, rule.role_id);
        _role && member.roles.add([_role]).then(console.log).catch(console.error)
    }
    if(member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.amount)) == -1){
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