const {keyStores} = require('near-api-js');
const path = require("path");
const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
exports.config = {
    ACCOUNT_ID: 'nepbot.testnet',
    APPLICATION_ID: '928559137179172874',
    RULE_CONTRACT:'v2-discord-roles.bhc8521.testnet',
    OCT_CONTRACT: 'registry.test_oct.testnet',
    POSTGRESQL: 'postgres://public_readonly:nearprotocol@testnet.db.explorer.indexer.near.dev/testnet_explorer',
    PARAS_API: "https://api-v2-mainnet.paras.id",
    nearWallet: {
        nodeUrl: "https://rpc.testnet.near.org",
        networkId: "testnet",
        keyStore: new keyStores.UnencryptedFileSystemKeyStore(credentialsPath),
    },
    walletAuthUrl:'http://nepbot.org'
}
