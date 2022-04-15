const config = require('../utils/config').getConfig();
const {connect} = require('near-api-js');
const {nearWallet} = config;
const tweetnacl = require("tweetnacl");
const bs58 = require('bs58');
const { queryUser, updateUser } = require('./server/services/UserInfoService');


const verifySignature = (data, signature, public_key) => {
    let bf_data = new Uint8Array(Buffer.from(JSON.stringify(data)))
    let bf_sign = new Uint8Array(bs58.decode(signature))
    let bf_pk = new Uint8Array(bs58.decode(public_key))
    let valid = tweetnacl.sign.detached.verify(bf_data, bf_sign, bf_pk);
    return valid;
}

exports.verifyAccountOwner = async (account_id, data, signature) => {
    const near = await connect(nearWallet)
    const account = await near.account(account_id)
    const accessKeys = await account.getAccessKeys()
    return accessKeys.some(it => {
        const publicKey = it.public_key.replace('ed25519:', '');
        return verifySignature(data, signature, publicKey)
    });
};

exports.verifyUserId = async (args, sign) => {
    let user = await queryUser({
        user_id: args.user_id,
        guild_id: args.guild_id
    })
    if (Date.now() - args.timestamp > 300 || args.timestamp < user.nonce) {
        return false
    }
    let keyStore = config.nearWallet.keyStore;
    let account_id = config.ACCOUNT_ID
    const keyPair = await keyStore.getKey(config.nearWallet.networkId, account_id);
    const ret = verifySignature({
        guild_id: args.guild_id,
        timestamp: args.timestamp,
        user_id: args.user_id
    }, sign, keyPair.toString())
    updateUser({
        user_id: args.user_id,
        guild_id: args.guild_id,
        nonce: args.timestamp
    })
    return ret
}

exports.verifyMultisign = async (account_id, args) => {
    let user = await queryUser({
        user_id: args.user_id,
        guild_id: args.guild_id
    })
    return await verifyAccountOwner(account_id, user.nonce, args.sign)
}

exports.getSign = async (args)=> {
    let keyStore = config.nearWallet.keyStore;
    let account_id = config.ACCOUNT_ID
    const keyPair = await keyStore.getKey(config.nearWallet.networkId, account_id);

    const args_string = JSON.stringify(args);
    const data_buffer = Buffer.from(args_string);
    const { signature } = keyPair.sign(data_buffer);
    return {sign:bs58.encode(signature)};
}