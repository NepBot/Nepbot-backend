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
config.nearWallet.keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);

// add the secret config from file (.env) into the following line. same style
config.bot_token = process.env.BOT_TOKEN;
config.bot_appid = process.env.BOT_APPID;
config.mysql_url = process.env.MYSQL_URL;
config.runtime_env = process.env.RUNTIME_ENV;
config.logger_mode = process.env.LOGGER_MODE;

module.exports = config;