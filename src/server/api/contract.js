const {connect, WalletConnection, providers} = require('near-api-js');
const config = require('../../utils/config').getConfig();
const {nearWallet,RULE_CONTRACT} = config;
const contract = async () => {
    // connect to NEAR
    const near = await connect(nearWallet);
    return await near.account();
}

exports.contract = contract;
exports.getFieldList = async () => {
    const account = await this.contract();
    return await account.viewFunction(RULE_CONTRACT, 'get_token_list', {})
}

exports.getRules = async (guildId) => {
    const account = await this.contract();
    // return await queryRule({guild_id: guildId});
    return await account.viewFunction(RULE_CONTRACT, 'get_guild', {guild_id: guildId})
}

exports.getRulesByField = async (key, value) => {
    const account = await this.contract();
    return await account.viewFunction(RULE_CONTRACT, 'get_field', {field_key: key, field_value: value})
}

exports.getBalanceOf = async (tokenId, accountId) => {
    const account = await this.contract();
    return await account.viewFunction(tokenId, 'ft_balance_of', {account_id: accountId})
}

exports.getNftCountOf = async (contractId, accountId) => {
    const account = await this.contract()
    return await account.viewFunction(contractId, "nft_supply_for_owner", {account_id: accountId})
}

exports.getParasNftCountOf = async (accountId, tokenId) => {
    const account = await this.contract()
    
    return await account.viewFunction(contractId, "nft_supply_for_owner", {account_id: accountId})
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
    if (validator && validator.validator_id) {
        return 'validator'
    } else if (delegator && delegator.length > 0) {
        return 'delegator'
    } else {
        return
    }
}

