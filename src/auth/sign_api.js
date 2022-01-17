const nearAPI = require("near-api-js");
const bs58 = require('bs58');
const path = require("path");
const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const {config} = require("../utils/config");

exports.getSign =  async (args)=> {
    // let keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore("/home/bhc/.near-credentials");
    let keyStore = new nearAPI.keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
    console.log(keyStore)
    let account_id = config.ACCOUNT_ID
    const keyPair = await keyStore.getKey(config.nearWallet.networkId, account_id);
    console.log("keyPair>>>>",keyPair)
    console.log(args)
    if(args[0].hasOwnProperty('signType')){

        const args_string = JSON.stringify(args[0].role_id);
        const data_buffer = Buffer.from(args_string);
        const { signature } = keyPair.sign(data_buffer);
        const public_key = keyPair.publicKey.data
        const bs58_public_key = bs58.encode(public_key)
        return {sign:bs58.encode(signature),pk:bs58_public_key};
    }else{
        const args_string = JSON.stringify(args);
        const data_buffer = Buffer.from(args_string);
        const { signature } = keyPair.sign(data_buffer);
        return {sign:bs58.encode(signature)};
    }
}
