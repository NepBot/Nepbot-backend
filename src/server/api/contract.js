const {connect, WalletConnection, providers} = require('near-api-js');
const {config} = require('../../utils/config');
const {nearWallet,RULE_CONTRACT} = config;
const contract = async () => {
    // connect to NEAR
    const near = await connect(nearWallet);
    return await near.account('nepbot.testnet');
}
const provider = new providers.JsonRpcProvider(nearWallet.nodeUrl);
exports.contract = contract;
exports.getFieldList = async () => {
    const account = await this.contract();
    return await account.viewFunction(RULE_CONTRACT, 'get_token_list', {})
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
    // let result = {};
    // //console.log(time, token_id)
    // // 
    // const expenditure = await queryExpenses(token_id, walletId, time);
    // // 
    // const income = await queryIncome(token_id, walletId, time);
    // console.group()
    // console.log('expenditure>>>', expenditure)
    // console.log('income>>>', income)
    // console.groupEnd()

    // result = {
    //     user_id,
    //     walletId,
    //     token_id,
    // }
    // if (expenditure.rows.length && walletId === expenditure.rows[0].sender_id) {
    //     result.expenditure = expenditure.rows[0].amount / 10 ** 24 || 0;
    // } else {
    //     result.expenditure = 0
    // }
    // if (income.rows.length && walletId === income.rows[0].receiver_id) {
    //     result.income = income.rows[0].amount / 10 ** 24 || 0;
    // } else {
    //     result.income = 0
    // }

    // return result;
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

exports.getRulesByField = async (key, value) => {
    const account = await this.contract();
    return await account.viewFunction(RULE_CONTRACT, 'get_field', {field_key: key, field_value: value})
}

exports.getBalanceOf = async (tokenId, accountId) => {
    const account = await this.contract();
    return await account.viewFunction(tokenId, 'ft_balance_of', {account_id: accountId})
}

exports.getNearBalanceOf = async (accountId) => {
    const near = await connect(nearWallet);
    const account = await near.account(accountId);
    const balance = await account.getAccountBalance()
    return balance.total
}

exports.getOctAppchainRole = async (appchain_id, account_id) => {
    const account = await this.contract();
    const validator = await account.viewFunction(appchain_id + '.' + config.OCT_CONTRACT, 'get_validator_profile', {validator_id: account_id})
    const delegator = await account.viewFunction(appchain_id + '.' + config.OCT_CONTRACT, 'get_delegations_of', {delegator_id: account_id})
    if (validator) {
        return 'validator'
    } else if (delegator && delegator.length > 0) {
        return 'delegator'
    } else {
        return
    }
}

exports.getkNewBlock = async (block_height) => {
    console.log(`fetched block height: ${block_height}`)
    while (true) {
        block = await provider.block({ finality: 'final' });
        if (block.header.height != block_height) {
            return block
        }
    }
}