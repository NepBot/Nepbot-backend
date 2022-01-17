const {getMemberTokenAmount, getRules} = require('../server/api/contract');
const {getMembers, getRoles, getMembersTokenList} = require("../server/api/guild");
const {config} = require("../utils/config");
const {updateUser} = require("../server/services/userService");
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
exports.timedTask = async () => {
    const guilds = client.guilds.cache.values();
    for (const guild of guilds) {
        const guild_id = guild.id;
        let memberList = await getMembers(guild_id); // 
        memberList = memberList.filter(item => item !== undefined)
        // tokenList = Array.from(tokenList.map(({token_id})=>token_id));
        const rules = await getRules(guild_id);  // 
        let tokenList = Array.from(rules.map(({token_id}) => token_id));
        console.log('tokenList',tokenList)
        // token
        if (memberList.length > 0) {
            for (const member of memberList) {
                const oauthTime = Math.floor(Math.floor(new Date(member?.oauthTime) / 1000) - 600) * 1000 * 1000000;
                //   token '



                const memberTokenList = await getMembersTokenList(member?.walletId);
                let userTokenList = await getUserTokenList({user_id: member.user.id});
                console.log("memberTokenList>>>>", memberTokenList);
                // token
                if(memberTokenList) {
                    for (const token of memberTokenList) {
                        const userToken = await getUserToken({
                            user_id: member.user.id,
                            token_id: token
                        });
                        // token token
                        if (!userToken) {
                            //   token
                            const tokenInfo = await getMemberTokenAmount(token, member.user.id, member.walletId, oauthTime);
                            const amount = (+tokenInfo.income) - (+tokenInfo.expenditure);
                            // 
                            await addUserToken({
                                user_id: member.user.id,
                                token_id: token,
                                amount: amount
                            });
                        }
                    }

                    if(userTokenList.length){
                        for (const user of userTokenList) {
                            //  
                            if (!memberTokenList.includes(user.token_id) && user.amount === 0) {
                                // await deleteUserToken({user_id:user.id,token_id:user.token_id})
                            }
                        }
                    }

                    // token 
                    userTokenList = await getUserTokenList({user_id: member.user.id});

                    for (const token of tokenList) {
                        // userTokenList
                        const currentToken = userTokenList.filter(item => item.token_id === token);
                        console.log("currentToken>>", Math.floor(Math.floor(new Date(currentToken[0]?.updatedAt) / 1000) - 600) * 1000 * 1000000)
                        const LastUpDateTime = Math.floor(Math.floor(new Date(currentToken[0]?.updatedAt) / 1000) - 600) * 1000 * 1000000;
                        if (currentToken.length) {
                            const tokenInfo = await getMemberTokenAmount(token, member.user.id, member.walletId, LastUpDateTime);
                            const currentAmount = +currentToken[0].amount + (+tokenInfo.income) - (+tokenInfo.expenditure);
                            await updateUserToken({
                                amount: currentAmount,
                                user_id: member.user.id,
                                token_id: token
                            })
                            // const rules = await getRules(token,guild_id);
                            const _rules = rules.filter(item => {
                                if (item.token_id === token) {
                                    return item;
                                }
                            })
                            let role = [];
                            let delRole = [];
                            for (const {amount, role_id} of _rules) {
                                if (!member._roles.includes(role_id) && currentAmount >= amount) {
                                    const _role = getRoles(guild_id, role_id);
                                    _role && role.push(_role)
                                }
                                if(member._roles.includes(role_id) &&  currentAmount < amount){
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
                }


            }
        }
    }
}
