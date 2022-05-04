// get the app root path
const appRoot = require('app-root-path');
// load .env file into process
require('dotenv').config({ path: `${appRoot}/.env` });
const { keyStores } = require('near-api-js');

const homedir = require('os').homedir();
const path = require('path');
const CREDENTIALS_DIR = '.near-credentials';
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);

const config = require('../../conf/near_net.json');
config.nearWallet.key_store = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

// add the secret config from file (.env) into the following line. same style
config.bot_token = process.env.BOT_TOKEN;
config.bot_appid = process.env.BOT_APPID;
config.mysql_url = process.env.MYSQL_URL;

module.exports = config;