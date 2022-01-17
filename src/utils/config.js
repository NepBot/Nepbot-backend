const {keyStores} = require('near-api-js');
const path = require("path");
const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
let guild = '';
exports.config = {
    ACCOUNT_ID: 'nepbot.testnet',
    // CLIENT_ID: '912261381208801280',
    
    // TOKEN: 'OTEwNDI4OTM2Nzc1ODIzMzkx.YZStBQ.1FSI9OOVONY4LGe7Ob9GYSEMjms',
    // CLIENT_SECRET: "WtEWzu82jb0l_HzDnRMKZyE3rKOf9coX",
    APPLICATION_ID: '928559137179172874',
    RULE_CONTRACT:'discord-roles.bhc8521.testnet',
    // MYSQL: {
    //     host: '127.0.0.1',
    //     user: 'root',
    //     password: '123456',
    //     database: 'discordserver',
    // },
    
    POSTGRESQL: 'postgres://public_readonly:nearprotocol@testnet.db.explorer.indexer.near.dev/testnet_explorer',
    nearWallet: {
        nodeUrl: "https://rpc.testnet.near.org",
        networkId: "testnet",
        keyStore: new keyStores.UnencryptedFileSystemKeyStore(credentialsPath),
        keyPath: new keyStores.UnencryptedFileSystemKeyStore(credentialsPath).keyDir,
        deps: {
            networkId: "testnet",
            keyStore: new keyStores.UnencryptedFileSystemKeyStore(credentialsPath),
        },
    },
    walletAuthUrl:'http://127.0.0.1:3000'
    // walletAuthUrl:'http://47.241.253.161'
}
