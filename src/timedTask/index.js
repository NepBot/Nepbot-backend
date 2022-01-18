const {getMemberTokenAmount, getRules, getTokenList, getBalanceOf} = require('../server/api/contract');
const {getMembers, getRoles, getMembersTokenList} = require("../server/api/guild");
const {queryActions} = require('../server/services/postgreService')
const {updateUser, getAllUser} = require("../server/services/userService");
const to = require("await-to-js");
const {
    queryUserToken,
    getUserTokenList,
    deleteUserToken,
    updateUserToken
} = require("../server/services/UserTokenService");
const {getUserToken, addUserToken} = require("../server/services/UserTokenService");
const {client} = require("../Bot");
/**
 * member member
 *
 * */

exports.timestamp = String(Date.now()) + "000000"

exports.timedTask = async () => {
    let tokenList = await getTokenList()
    let actions = await queryActions(tokenList, this.timestamp)
    let accountIdList = []
    let tokenList = []
    for (action in actions) {
        accountIdList.push(action.sender_id)
        accountIdList.push(action.receiver_id)
        tokenList.push(action.token_id)
    }

    let userTokens = await getUserTokenList({
        near_wallet_id: {
            in: accountIdList
        },
        token_id: {
            in: tokenList
        }
    })

    
    for (userToken in userTokens) {
        let newAmount = await getBalanceOf(userToken.token_id, userToken.near_wallet_id)
        await updateUserToken({
            amount: newAmount,
            near_wallet_id: userToken.near_wallet_id,
            token_id: userToken.token_id
        })
        let roles = await getRulesByToken(userToken.token_id)
        let guild_ids = []
        roles.map(item => {
            guild_ids.push(item.guild_id)
        })
        let users = await getAllUser({
            guild_id: {
                in: guild_ids
            },
            near_wallet_id: userToken.near_wallet_id,
        })
        for (user in users) {
            let member = await getMembers(guild_id, user.user_id)
            let guildRoles = await getRules(user.guild_id)

            let role = [];
            let delRole = [];
            for (const {amount, role_id} of guildRoles) {
                if (!member._roles.includes(role_id) && newAmount >= amount) {
                    const _role = getRoles(guild_id, role_id);
                    _role && role.push(_role)
                }
                if(member._roles.includes(role_id) &&  newAmount < amount){
                    const _role = getRoles(guild_id, role_id);
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

    this.timestamp = String(Date.now()) + "000000"
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
//                 let userTokenList = await getUserTokenList({user_id: member.user.id});
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
//                             await addUserToken({
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
//                     userTokenList = await getUserTokenList({user_id: member.user.id});

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
