
const bs58 = require('bs58');
const {config} = require("../utils/config");

exports.getSign =  async (args)=> {
    let keyStore = config.nearWallet.keyStore;
    let account_id = config.ACCOUNT_ID
    const keyPair = await keyStore.getKey(config.nearWallet.networkId, account_id);

    const args_string = JSON.stringify(args);
    const data_buffer = Buffer.from(args_string);
    const { signature } = keyPair.sign(data_buffer);
    return {sign:bs58.encode(signature)};
    
}
