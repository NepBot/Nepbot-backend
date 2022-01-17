const {connect, WalletConnection} = require('near-api-js');
const path = require("path");
const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const {config} = require('../../utils/config');
const {nearWallet,RULE_CONTRACT} = config;
const {queryUser} = require("../services/userService");
const {queryExpenses, queryIncome} = require("../services/postgreService");
const {queryRule, getTokenList} = require("../services/RuleService");
const contract = async () => {
    // connect to NEAR
    const near = await connect(nearWallet);
    return await near.account('discord-roles.bhc8521.testnet');
}
exports.contract = contract;
exports.getTokenList = async (guild_id) => {
    // const _provider = await contract()
    // return await _provider.viewFunction('discord-roles.bhc8521.testnet', 'get_token_list');
    return await getTokenList(guild_id)
}

exports.getMemberTokenAmount = async (token_id, user_id, walletId, time) => {
    /**
     * token  
     *
     * 
     *  token
     *    、 
     * token   =  -  + 
     *
     * */
    let result = {};
    console.log(time, token_id)
    // 
    const expenditure = await queryExpenses(token_id, walletId, time);
    // 
    const income = await queryIncome(token_id, walletId, time);
    console.group()
    console.log('expenditure>>>', expenditure)
    console.log('income>>>', income)
    console.groupEnd()

    result = {
        user_id,
        walletId,
        token_id,
    }
    if (expenditure.rows.length && walletId === expenditure.rows[0].sender_id) {
        result.expenditure = expenditure.rows[0].amount / 10 ** 24 || 0;
    } else {
        result.expenditure = 0
    }
    if (income.rows.length && walletId === income.rows[0].receiver_id) {
        result.income = income.rows[0].amount / 10 ** 24 || 0;
    } else {
        result.income = 0
    }

    return result;
}
exports.getRules = async (guildId) => {
    // if (guildId) {
    //     return await queryRule({token_id: tokenId, guild_id: guildId});
    // }
    // if (!tokenId) {
        const account = await this.contract();
        // return await queryRule({guild_id: guildId});
        return await account.viewFunction(RULE_CONTRACT, 'get_guild', {guild_id: guildId})
    // }
    // const _provider = await contract();
    // return await queryRule({token_id: tokenId});
}
