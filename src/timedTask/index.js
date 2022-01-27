const {getOctAppchainRole, getRules, getFieldList, getBalanceOf, getRulesByField} = require('../server/api/contract');
const {getMembers, getRoles, getMembersTokenList} = require("../server/api/guild");
const {queryActions, queryOctActions} = require('../server/services/postgreService')
const {updateUser, getAllUser} = require("../server/services/userService");
const {getUserFieldList, addUserField} = require("../server/services/UserFieldService");
const BN = require('bn.js')
/**
 * member member
 *
 * */
let timestamp = String(Date.now()) + "000000"
let updatingGuildList = []

async function octTask() {
    let actions = await queryOctActions(timestamp)
    let accountIdList = []
    let appchainIdList = []
    for (action of actions) {
        appchainIdList.push(action.appchain_id)
        accountIdList.push(action.signer_id)
    }

    let userFields = await getUserFieldList({
        near_wallet_id: {
            $in: accountIdList
        },
        key: 'appchain_id',
        value: {
            $in: appchainIdList
        }
    })

    for (userField of userFields) {
        let octRole = await getOctAppchainRole(userField.value, userField.near_wallet_id)
        let roles = await getRulesByField('appchain_id', userField.value)
        let guild_ids = []
        roles.map(item => {
            guild_ids.push(item.guild_id)
        })

        let users = await getAllUser({
            guild_id: {
                $in: guild_ids
            },
            near_wallet_id: userField.near_wallet_id,
        })

        for (user of users) {
            let member = await getMembers(user.guild_id, user.user_id)
            let guildRoles = await getRules(user.guild_id)

            let role = [];
            let delRole = [];
            for (const {fields, role_id, key_field} of guildRoles) {
                if (key_field[0] != 'appchain_id') {
                    continue
                }
                if (!member._roles.includes(role_id) && octRole == fields.oct_role) {
                    const _role = getRoles(user.guild_id, role_id);
                    _role && role.push(_role)
                }
                if(member._roles.includes(role_id) &&  octRole != fields.oct_role){
                    const _role = getRoles(user.guild_id, role_id);
                    _role && delRole.push(_role)
                }
            }
            if(role.length){
                member.roles.add(role).then(console.log).catch(console.error)
            }
            if(delRole.length){
                member.roles.remove(delRole).then(console.log).catch(console.error)
            }
        }
    }
    
}

async function tokenTask() {
    let allFieldList = await getFieldList()
    let allTokenList = []
    for (field of allFieldList) {
        allTokenList.push(field[1])
    }
    let actions = await queryActions(allTokenList, timestamp)
    let accountIdList = []
    let tokenList = []
    for (action of actions) {
        accountIdList.push(action.sender_id)
        accountIdList.push(action.receiver_id)
        tokenList.push(action.token_id)
    }

    let userTokens = await getUserFieldList({
        near_wallet_id: {
            $in: accountIdList
        },
        key: 'token_id',
        value: {
            $in: tokenList
        }
    })

    
    for (userToken of userTokens) {
        let newAmount = await getBalanceOf(userToken.value, userToken.near_wallet_id)
        // await updateUserToken({
        //     amount: newAmount,
        //     near_wallet_id: userToken.near_wallet_id,
        //     token_id: userToken.token_id
        // })
        let roles = await getRulesByField('token_id', userToken.value)
        let guild_ids = []
        roles.map(item => {
            guild_ids.push(item.guild_id)
        })
        let users = await getAllUser({
            guild_id: {
                $in: guild_ids
            },
            near_wallet_id: userToken.near_wallet_id,
        })
        for (user of users) {
            let member = await getMembers(user.guild_id, user.user_id)
            let guildRoles = await getRules(user.guild_id)

            let role = [];
            let delRole = [];
            for (const {fields, role_id, key_field} of guildRoles) {
                if (key_field[0] != 'token_id') {
                    continue
                }
                if (!member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) != -1) {
                    const _role = getRoles(user.guild_id, role_id);
                    _role && role.push(_role)
                }
                if(member._roles.includes(role_id) && new BN(newAmount).cmp(new BN(fields.token_amount)) == -1){
                    const _role = getRoles(user.guild_id, role_id);
                    _role && delRole.push(_role)
                }
            }
            if(role.length){
                member.roles.add(role).then(console.log).catch(console.error)
            }
            if(delRole.length){
                member.roles.remove(delRole).then(console.log).catch(console.error)
            }
        }

        
    }
}

async function updateGuildTask() {
    console.log(updatingGuildList)
    for (guild_id in updatingGuildList) {
        count = updatingGuildList[guild_id]
        if (count <= 0) {
            updatingGuildList[guild_id] = null
            return
        }
        let rules = await getRules(guild_id)
        let userList = await getAllUser({
            guild_id: guild_id
        })
        
        
        let rulesMap = {
            token: [],
            oct: []
        }
        for (rule of rules) {
            if (rule.key_field[0] == 'token_id') {
                rulesMap.token.push(rule)
            } else if (rule.key_field[0] == 'appchain_id') {
                rulesMap.oct.push(rule)
            }
        }
        

        for (user of userList) {
            let role = [];
            let delRole = [];
            const member = await getMembers(guild_id, user.user_id);
            for (const rule of rulesMap.token) {
                await addUserField({
                    near_wallet_id: user.near_wallet_id,
                    key: rule.key_field[0],
                    value: rule.key_field[1]
                });
                const tokenAmount = await getBalanceOf(rule.key_field[1], user.near_wallet_id) 
                console.log(tokenAmount, rule.fields.amount)
                
                if (!member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.amount)) != -1 ) {
                    const _role = getRoles(rule.guild_id, rule.role_id);
                    _role && role.push(_role)
                }
                if(member._roles.includes(rule.role_id) && new BN(tokenAmount).cmp(new BN(rule.fields.amount)) == -1){
                    const _role = getRoles(rule.guild_id, rule.role_id);
                    _role && delRole.push(_role)
                }
            }

            for (const rule of rulesMap.oct) {
                await addUserField({
                    near_wallet_id: user.near_wallet_id,
                    key: rule.key_field[0],
                    value: rule.key_field[1]
                });
                let octRole = await getOctAppchainRole(rule.key_field[1], user.near_wallet_id)

                if (!member._roles.includes(rule.role_id) && octRole == rule.fields.oct_role) {
                    const _role = getRoles(rule.guild_id, rule.role_id);
                    _role && role.push(_role)
                }
                if(member._roles.includes(rule.role_id) && !octRole == rule.fields.oct_role){
                    const _role = getRoles(rule.guild_id, rule.role_id);
                    _role && delRole.push(_role)
                }
            }


            if(role.length){
                member.roles.add(role).then(console.log).catch(console.error)
            }
            if(delRole.length){
                member.roles.remove(delRole).then(console.log).catch(console.error)
            }
            console.log(role, delRole)
        }
        updatingGuildList[guild_id] -= 1
    }
}

exports.timedTask = async () => {
    await tokenTask()
    await octTask()
    await updateGuildTask()

    timestamp = String(Date.now()) + "000000"
}

exports.updateGuild = (guild_id) => {
    updatingGuildList[guild_id] = 10
}

// exports.timedTask = async () => {
//     const guilds = client.guilds.cache.values();
//     for (const guild of guilds) {
//         const guild_id = guild.id;
//         let memberList = await getMembers(guild_id); // 
//         memberList = memberList.filter(item => item !== undefined)
//         // tokenList = Array.from(tokenList.map(({token_id})=>token_id));
//         const rules = await getRules(guild_id);  // 
//         let tokenList = Array.from(rules.map(({token_id}) => token_id));
//         console.log('tokenList',tokenList)
//         // token
//         if (memberList.length > 0) {
//             for (const member of memberList) {
//                 const oauthTime = Math.floor(Math.floor(new Date(member?.oauthTime) / 1000) - 600) * 1000 * 1000000;
//                 //   token '



//                 const memberTokenList = await getMembersTokenList(member?.walletId);
//                 let userTokenList = await getUserFieldList({user_id: member.user.id});
//                 console.log("memberTokenList>>>>", memberTokenList);
//                 // token
//                 if(memberTokenList) {
//                     for (const token of memberTokenList) {
//                         const userToken = await getUserToken({
//                             user_id: member.user.id,
//                             token_id: token
//                         });
//                         // token token
//                         if (!userToken) {
//                             //   token
//                             const tokenInfo = await getMemberTokenAmount(token, member.user.id, member.walletId, oauthTime);
//                             const amount = (+tokenInfo.income) - (+tokenInfo.expenditure);
//                             // 
//                             await addUserField({
//                                 user_id: member.user.id,
//                                 token_id: token,
//                                 amount: amount
//                             });
//                         }
//                     }

//                     if(userTokenList.length){
//                         for (const user of userTokenList) {
//                             //  
//                             if (!memberTokenList.includes(user.token_id) && user.amount === 0) {
//                                 // await deleteUserToken({user_id:user.id,token_id:user.token_id})
//                             }
//                         }
//                     }

//                     // token 
//                     userTokenList = await getUserFieldList({user_id: member.user.id});

//                     for (const token of tokenList) {
//                         // userTokenList
//                         const currentToken = userTokenList.filter(item => item.token_id === token);
//                         console.log("currentToken>>", Math.floor(Math.floor(new Date(currentToken[0]?.updatedAt) / 1000) - 600) * 1000 * 1000000)
//                         const LastUpDateTime = Math.floor(Math.floor(new Date(currentToken[0]?.updatedAt) / 1000) - 600) * 1000 * 1000000;
//                         if (currentToken.length) {
//                             const tokenInfo = await getMemberTokenAmount(token, member.user.id, member.walletId, LastUpDateTime);
//                             const currentAmount = +currentToken[0].amount + (+tokenInfo.income) - (+tokenInfo.expenditure);
//                             await updateUserToken({
//                                 amount: currentAmount,
//                                 user_id: member.user.id,
//                                 token_id: token
//                             })
//                             // const rules = await getRules(token,guild_id);
//                             const _rules = rules.filter(item => {
//                                 if (item.token_id === token) {
//                                     return item;
//                                 }
//                             })
//                             let role = [];
//                             let delRole = [];
//                             for (const {amount, role_id} of _rules) {
//                                 if (!member._roles.includes(role_id) && currentAmount >= amount) {
//                                     const _role = getRoles(guild_id, role_id);
//                                     _role && role.push(_role)
//                                 }
//                                 if(member._roles.includes(role_id) &&  currentAmount < amount){
//                                     const _role = getRoles(guild_id, role_id);
//                                     _role && delRole.push(_role)
//                                 }
//                             }
//                             if(role.length){
//                                 member.roles.add(role).then(console.log).catch(console.error)
//                             }
//                             if(delRole.length){
//                                 member.roles.remove(delRole).then(console.log).catch(console.error)
//                             }
//                         }
//                     }
//                 }


//             }
//         }
//     }
// }
