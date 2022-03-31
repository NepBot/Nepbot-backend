const {keyStores} = require('near-api-js');
const path = require("path");
const homedir = require("os").homedir();
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const env = require("./env.js").env
const key = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

export function getConfig() {
    switch (env) {
        case 'production':
        case 'mainnet':
            return {
                nearWallet: {
                    networkId: 'mainnet',
                    keyStore: key,
                    nodeUrl: 'https://rpc.mainnet.near.org',
                    walletUrl: 'https://wallet.near.org',
                    helperUrl: 'https://helper.mainnet.near.org',
                },
                port: 5000,
                RULE_CONTRACT: 'app.nepbot.near',
                OCT_CONTRACT: 'registry.test_oct.testnet',
                ACCOUNT_ID: 'sign.nepbot.near',
                APPLICATION_ID: '958997413803196476',
                POSTGRESQL: "postgres://public_readonly:nearprotocol@mainnet.db.explorer.indexer.near.dev/mainnet_explorer",
                PARAS_API: "https://api-v2-mainnet.paras.id",
                walletAuthUrl:'http://nepbot.org'
            }
        case 'development':
        case 'testnet':
            return {
                nearWallet: {
                    networkId: 'testnet',
                    keyStore: key,
                    nodeUrl: 'https://rpc.testnet.near.org',
                    walletUrl: 'https://wallet.testnet.near.org',
                    helperUrl: 'https://helper.testnet.near.org',
                },   
                port: 6000,
                RULE_CONTRACT: 'v2-discord-roles.bhc8521.testnet',
                LINKDROP: 'linkdrop6.bhc8521.testnet',
                ACCOUNT_ID: 'nepbot.testnet',
                APPLICATION_ID: '928559137179172874',
                OCT_CONTRACT: 'registry.test_oct.testnet',
                POSTGRESQL: 'postgres://public_readonly:nearprotocol@testnet.db.explorer.indexer.near.dev/testnet_explorer',
                PARAS_API: "https://api-v2-mainnet.paras.id",
                walletAuthUrl:'http://testnet.nepbot.org'
            }
        case 'betanet':
            return {
            networkId: 'betanet',
            keyStore: key,
            nodeUrl: 'https://rpc.betanet.near.org',
            walletUrl: 'https://wallet.betanet.near.org',
            helperUrl: 'https://helper.betanet.near.org'
            }
        case 'local':
            return {
            networkId: 'local',
            keyStore: key,
            nodeUrl: 'http://localhost:3030',
            keyPath: `${process.env.HOME}/.near/validator_key.json`,
            walletUrl: 'http://localhost:4000/wallet',
            }
        case 'test':
        case 'ci':
            return {
            networkId: 'shared-test',
            keyStore: key,
            nodeUrl: 'https://rpc.ci-testnet.near.org',
            masterAccount: 'test.near'
            }
        case 'ci-betanet':
            return {
            networkId: 'shared-test-staging',
            keyStore: key,
            nodeUrl: 'https://rpc.ci-betanet.near.org',
            masterAccount: 'test.near'
            }
        default:
            throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
    }
}